"""
Trains the food recognition model and exports it for the API.

    pip install -r ml/requirements-train.txt
    python -m ml.check_dataset --data-dir ml/data          # check your photos first
    python -m ml.train --data-dir ml/data --epochs 15      # writes models/food_classifier.onnx + labels.json + model_meta.json

It fine-tunes an ImageNet-pretrained network (transfer learning), which works well from a few hundred photos per class.
The backend then runs the exported ONNX file with AI_PROVIDER=onnx, no PyTorch needed on the server.
"""
import argparse
import json
import sys
import time
from pathlib import Path

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
ARCHS = ("mobilenet_v3_large", "efficientnet_b0", "resnet50")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--data-dir", type=Path, default=Path("ml/data"), help="contains train/ and optionally val/")
    p.add_argument("--out-dir", type=Path, default=Path("models"))
    p.add_argument("--arch", choices=ARCHS, default="mobilenet_v3_large", help="mobilenet_v3_large is small and fast; resnet50 is bigger")
    p.add_argument("--epochs", type=int, default=15)
    p.add_argument("--freeze-epochs", type=int, default=2, help="epochs that train only the new final layer first")
    p.add_argument("--batch-size", type=int, default=32)
    p.add_argument("--lr", type=float, default=1e-3, help="learning rate for the final layer; the backbone uses lr/10")
    p.add_argument("--img-size", type=int, default=224)
    p.add_argument("--val-split", type=float, default=0.15, help="used only when there is no val/ folder")
    p.add_argument("--workers", type=int, default=4)
    p.add_argument("--no-pretrained", action="store_true", help="train from scratch (needs far more data)")
    p.add_argument("--label-map", type=Path, help="JSON {class folder: food id}; copied next to the model")
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--resume", action="store_true", help="continue from out-dir/checkpoint.pt if it exists")
    p.add_argument("--checkpoint-every", type=int, default=1, help="save a resumable checkpoint every N epochs (0 disables)")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    try:
        import torch
        import torch.nn as nn
        from torch.utils.data import DataLoader, Subset
        from torchvision import datasets, models, transforms
    except ImportError:
        sys.exit("PyTorch is not installed. Run: pip install -r ml/requirements-train.txt")

    torch.manual_seed(args.seed)
    import os

    forced = os.environ.get("AFCM_DEVICE")  # e.g. set AFCM_DEVICE=cpu to force the CPU for a speed comparison
    if forced:
        device = torch.device(forced)
    elif torch.cuda.is_available():
        device = torch.device("cuda")
    elif hasattr(torch, "xpu") and torch.xpu.is_available():
        device = torch.device("xpu")  # Intel Arc / Core Ultra graphics
    elif torch.backends.mps.is_available():
        device = torch.device("mps")
    else:
        device = torch.device("cpu")
    use_amp = device.type == "cuda"
    print(f"Device: {device}")

    size = args.img_size
    resize_size = int(round(size * 256 / 224))
    normalize = transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)
    # The evaluation transform is what app/ai/preprocess.py reproduces at prediction time. Keep them in sync.
    train_tf = transforms.Compose(
        [
            transforms.RandomResizedCrop(size, scale=(0.5, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(brightness=0.25, contrast=0.25, saturation=0.25),
            transforms.ToTensor(),
            normalize,
        ]
    )
    eval_tf = transforms.Compose([transforms.Resize(resize_size), transforms.CenterCrop(size), transforms.ToTensor(), normalize])

    train_dir, val_dir = args.data_dir / "train", args.data_dir / "val"
    if not train_dir.is_dir():
        sys.exit(f"{train_dir} not found. See ml/README.md for the dataset layout.")

    if val_dir.is_dir():
        train_set = datasets.ImageFolder(train_dir, train_tf)
        val_set = datasets.ImageFolder(val_dir, eval_tf)
        if train_set.classes != val_set.classes:
            # A class can end up with zero images on one side after a small dataset's random split
            # (ml.prepare_dataset always tries for at least one validation image, but a class with very
            # few source photos can still miss). Align both datasets onto one shared class list instead
            # of crashing: a class missing from val/ just isn't scored, but it still trains normally.
            missing_val = sorted(set(train_set.classes) - set(val_set.classes))
            missing_train = sorted(set(val_set.classes) - set(train_set.classes))
            if missing_train:
                sys.exit(
                    f"{len(missing_train)} class(es) have images in val/ but none in train/, so the model "
                    f"could never learn them: {', '.join(missing_train[:10])}"
                    + (" ..." if len(missing_train) > 10 else "")
                    + ". Add more photos for these classes, or remove them from ml/data, then try again."
                )
            print(
                f"Note: {len(missing_val)} class(es) have too few photos for any validation images, "
                f"so their accuracy can't be measured this run: {', '.join(missing_val[:10])}"
                + (" ..." if len(missing_val) > 10 else "")
            )
            union = sorted(set(train_set.classes) | set(val_set.classes))
            new_index = {c: i for i, c in enumerate(union)}
            for ds in (train_set, val_set):
                old_classes = ds.classes
                ds.samples = [(path, new_index[old_classes[old_idx]]) for path, old_idx in ds.samples]
                ds.targets = [t for _, t in ds.samples]
                ds.classes = union
                ds.class_to_idx = new_index
    else:
        full_train = datasets.ImageFolder(train_dir, train_tf)
        full_eval = datasets.ImageFolder(train_dir, eval_tf)
        order = torch.randperm(len(full_train), generator=torch.Generator().manual_seed(args.seed)).tolist()
        n_val = max(1, int(len(order) * args.val_split))
        train_set, val_set = Subset(full_train, order[n_val:]), Subset(full_eval, order[:n_val])
        train_set.classes = val_set.classes = full_train.classes  # type: ignore[attr-defined]
    classes: list[str] = train_set.classes  # type: ignore[attr-defined]
    print(f"{len(classes)} classes | {len(train_set)} train images | {len(val_set)} validation images")

    loader_args = dict(batch_size=args.batch_size, num_workers=args.workers, pin_memory=device.type == "cuda")
    train_loader = DataLoader(train_set, shuffle=True, drop_last=len(train_set) > args.batch_size, **loader_args)
    val_loader = DataLoader(val_set, shuffle=False, **loader_args)

    # ---- model: pretrained backbone + a new final layer with one output per class ----
    model = models.get_model(args.arch, weights=None if args.no_pretrained else "DEFAULT")
    last_name, last = None, None
    for name, module in model.named_modules():
        if isinstance(module, nn.Linear):
            last_name, last = name, module
    assert last_name is not None and last is not None, "could not find the final layer"
    parent = model
    *path, leaf = last_name.split(".")
    for part in path:
        parent = parent._modules[part]
    head = nn.Linear(last.in_features, len(classes))
    parent._modules[leaf] = head
    model.to(device)

    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    scaler = torch.amp.GradScaler("cuda", enabled=use_amp)

    def set_backbone_trainable(trainable: bool) -> None:
        for p in model.parameters():
            p.requires_grad = trainable
        for p in head.parameters():
            p.requires_grad = True

    def make_optimizer(phase_epochs: int, backbone: bool):
        head_ids = {id(p) for p in head.parameters()}
        groups = [{"params": list(head.parameters()), "lr": args.lr}]
        if backbone:
            groups.append({"params": [p for p in model.parameters() if id(p) not in head_ids], "lr": args.lr / 10})
        opt = torch.optim.AdamW(groups, weight_decay=1e-4)
        return opt, torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=max(1, phase_epochs * len(train_loader)))

    def evaluate():
        model.eval()
        correct1 = correct5 = total = 0
        per_class = {c: [0, 0] for c in range(len(classes))}
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                logits = model(images)
                top5 = logits.topk(min(5, len(classes)), dim=1).indices
                pred = top5[:, 0]
                correct1 += (pred == labels).sum().item()
                correct5 += (top5 == labels.unsqueeze(1)).any(dim=1).sum().item()
                total += labels.size(0)
                for y, y_hat in zip(labels.tolist(), pred.tolist()):
                    per_class[y][1] += 1
                    per_class[y][0] += int(y == y_hat)
        return correct1 / total, correct5 / total, per_class

    args.out_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = args.out_dir / "checkpoint.pt"
    best_acc, best_state, best_epoch, start_epoch = -1.0, None, 0, 1
    freeze = min(args.freeze_epochs, args.epochs)
    optimizer = scheduler = None  # set below, either fresh or restored from the checkpoint

    if args.resume and checkpoint_path.is_file():
        checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)
        if checkpoint.get("classes") != classes:
            sys.exit(
                f"{checkpoint_path} was trained on different classes than {args.data_dir}. "
                "Use a different --out-dir, or drop --resume to start over."
            )
        model.load_state_dict(checkpoint["model_state"])
        best_acc, best_state, best_epoch = checkpoint["best_acc"], checkpoint["best_state"], checkpoint["best_epoch"]
        start_epoch = checkpoint["epoch"] + 1
        backbone_at_resume = start_epoch > freeze
        set_backbone_trainable(backbone_at_resume)
        optimizer, scheduler = make_optimizer(args.epochs - start_epoch + 1 if backbone_at_resume else freeze - start_epoch + 1, backbone_at_resume)
        optimizer.load_state_dict(checkpoint["optimizer_state"])
        scheduler.load_state_dict(checkpoint["scheduler_state"])
        print(f"Resuming from {checkpoint_path}: epoch {start_epoch}/{args.epochs} (best so far: epoch {best_epoch}, top-1 {best_acc:.1%})")
        if start_epoch > args.epochs:
            print("This checkpoint already finished every epoch. Re-running the export step only.")

    for epoch in range(start_epoch, args.epochs + 1):
        if epoch == start_epoch and optimizer is not None:
            pass  # optimizer/scheduler already restored from the checkpoint above
        elif epoch == start_epoch or epoch == freeze + 1:
            backbone = epoch > freeze
            set_backbone_trainable(backbone)
            optimizer, scheduler = make_optimizer(args.epochs - epoch + 1 if backbone else freeze, backbone)
            print("Training the full network." if backbone else "Training only the new final layer.")

        model.train()
        start, running, seen = time.time(), 0.0, 0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad(set_to_none=True)
            with torch.autocast(device_type=device.type, enabled=use_amp):
                loss = criterion(model(images), labels)
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            scheduler.step()
            running += loss.item() * labels.size(0)
            seen += labels.size(0)

        top1, top5, per_class = evaluate()
        print(f"epoch {epoch:>2}/{args.epochs}  loss {running / max(1, seen):.3f}  val top-1 {top1:.1%}  top-5 {top5:.1%}  ({time.time() - start:.0f}s)")
        if top1 > best_acc:
            best_acc, best_epoch = top1, epoch
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}

        if args.checkpoint_every and (epoch % args.checkpoint_every == 0 or epoch == args.epochs):
            torch.save(
                {
                    "epoch": epoch,
                    "classes": classes,
                    "model_state": model.state_dict(),
                    "optimizer_state": optimizer.state_dict(),
                    "scheduler_state": scheduler.state_dict(),
                    "best_acc": best_acc,
                    "best_epoch": best_epoch,
                    "best_state": best_state,
                },
                checkpoint_path,
            )
            print(f"  (checkpoint saved: {checkpoint_path})")

    assert best_state is not None
    model.load_state_dict(best_state)
    top1, top5, per_class = evaluate()
    print(f"\nBest epoch {best_epoch}: top-1 {top1:.1%}, top-5 {top5:.1%}")
    weakest = sorted(((c[0] / c[1], classes[i], c[1]) for i, c in per_class.items() if c[1] > 0))[:5]
    print("Weakest classes:", ", ".join(f"{name} {acc:.0%} (n={n})" for acc, name, n in weakest))

    # ---- export ----
    onnx_path = args.out_dir / "food_classifier.onnx"
    model.eval().cpu()
    dummy = torch.randn(1, 3, size, size)
    export_kwargs = dict(
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
    )
    try:
        torch.onnx.export(model, dummy, str(onnx_path), dynamo=False, **export_kwargs)  # torch >= 2.5
    except TypeError:
        torch.onnx.export(model, dummy, str(onnx_path), **export_kwargs)

    # Confirm the exported file gives the same answers as the PyTorch model.
    import numpy as np
    import onnxruntime as ort

    session = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
    with torch.no_grad():
        expected = model(dummy).numpy()
    got = session.run(None, {"input": dummy.numpy()})[0]
    diff = float(np.abs(expected - got).max())
    print(f"ONNX check: max difference {diff:.2e}" + ("" if diff < 1e-3 else "  <-- larger than expected, do not trust this export"))

    (args.out_dir / "labels.json").write_text(json.dumps(classes, indent=2), encoding="utf-8")
    (args.out_dir / "model_meta.json").write_text(
        json.dumps(
            {
                "arch": args.arch,
                "input_size": size,
                "resize_size": resize_size,
                "mean": IMAGENET_MEAN,
                "std": IMAGENET_STD,
                "output": "logits",
                "val_top1": round(top1, 4),
                "val_top5": round(top5, 4),
                "classes": len(classes),
                "trained_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    if args.label_map:
        (args.out_dir / "label_map.json").write_text(args.label_map.read_text(encoding="utf-8"), encoding="utf-8")

    print(f"\nSaved to {args.out_dir}/. Start the API with AI_PROVIDER=onnx to use it.")
    checkpoint_path.unlink(missing_ok=True)  # training finished; the checkpoint is no longer needed
    return 0


if __name__ == "__main__":
    sys.exit(main())