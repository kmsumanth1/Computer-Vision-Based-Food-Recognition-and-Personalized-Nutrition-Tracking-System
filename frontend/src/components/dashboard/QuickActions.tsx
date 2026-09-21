import { Link } from 'react-router-dom';
import { Camera, ImagePlus, PencilLine, ScanBarcode, type LucideIcon } from 'lucide-react';

interface QuickActionsProps {
  onAddManually: () => void;
}

const LINKS: Array<{ label: string; icon: LucideIcon; to: string }> = [
  { label: 'Scan Food', icon: Camera, to: '/food-analysis?mode=camera' },
  { label: 'Upload Image', icon: ImagePlus, to: '/food-analysis?mode=upload' },
  { label: 'Scan Barcode', icon: ScanBarcode, to: '/food-analysis?mode=barcode' },
];

const TILE =
  'group flex min-h-[84px] flex-col items-start justify-between gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-card transition-colors hover:border-pine-300 hover:bg-pine-50';

export default function QuickActions({ onAddManually }: QuickActionsProps) {
  return (
    <section aria-label="Quick actions">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {LINKS.map(({ label, icon: Icon, to }) => (
          <Link key={label} to={to} className={TILE}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine-50 text-pine-600 transition-colors group-hover:bg-white">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="font-semibold text-ink">{label}</span>
          </Link>
        ))}
        <button type="button" onClick={onAddManually} className={TILE}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine-50 text-pine-600 transition-colors group-hover:bg-white">
            <PencilLine className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-semibold text-ink">Add Food Manually</span>
        </button>
      </div>
    </section>
  );
}
