import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Upload,
  Image as ImageIcon,
  ScanLine,
  CheckCircle2,
  X,
  Loader2,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Plus,
  RotateCcw,
  SwitchCamera,
} from "lucide-react";

export default function ScanFood() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const [mode, setMode] = useState("camera");
  const [cameraOn, setCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");

  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  /* ---------------- CAMERA ---------------- */

  const startCamera = async () => {
    try {
      setError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera access is not supported by this browser.");
        return;
      }

      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: facingMode,
          },
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 720,
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraOn(true);
    } catch (err) {
      console.error(err);
      setCameraOn(false);

      if (err.name === "NotAllowedError") {
        setError(
          "Camera permission was denied. Please allow camera access."
        );
      } else if (err.name === "NotFoundError") {
        setError("No camera was found on this device.");
      } else {
        setError("Unable to access the camera.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
  };

  const switchCamera = async () => {
    const newFacingMode =
      facingMode === "environment"
        ? "user"
        : "environment";

    setFacingMode(newFacingMode);

    if (cameraOn) {
      stopCamera();

      setTimeout(async () => {
        try {
          const stream =
            await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: {
                  ideal: newFacingMode,
                },
                width: {
                  ideal: 1280,
                },
                height: {
                  ideal: 720,
                },
              },
              audio: false,
            });

          streamRef.current = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }

          setCameraOn(true);
        } catch (err) {
          console.error(err);
          setError("Unable to switch camera.");
        }
      }, 100);
    }
  };

  /* ---------------- CAPTURE ---------------- */

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    if (
      video.readyState < 2 ||
      video.videoWidth === 0
    ) {
      setError("Camera is not ready yet.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Unable to capture image.");
          return;
        }

        const capturedFile = new File(
          [blob],
          `food-capture-${Date.now()}.jpg`,
          {
            type: "image/jpeg",
          }
        );

        const previewUrl =
          URL.createObjectURL(blob);

        setFile(capturedFile);
        setImage(previewUrl);
        setResult(null);
        setError("");

        stopCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  /* ---------------- UPLOAD ---------------- */

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB.");
      return;
    }

    stopCamera();

    setFile(selectedFile);
    setImage(URL.createObjectURL(selectedFile));
    setResult(null);
    setError("");
  };

  const handleInputChange = (event) => {
    handleFile(event.target.files?.[0]);
  };

  /* ---------------- ANALYZE ---------------- */

  const analyzeFood = async () => {
    if (!file) {
      setError("Capture or upload a food image first.");
      return;
    }

    setAnalyzing(true);
    setError("");

    /*
      TEMPORARY RESULT

      Later:

      React
        ↓
      FastAPI
        ↓
      Food Recognition Model
        ↓
      Nutrition Calculation
    */

    setTimeout(() => {
      setResult({
        food_name: "Chicken Rice Bowl",
        confidence: 94,
        calories: 520,
        protein: 38,
        carbs: 56,
        fat: 14,
        serving: "1 bowl",
      });

      setAnalyzing(false);
    }, 1800);
  };

  /* ---------------- RESET ---------------- */

  const resetScan = () => {
    stopCamera();

    if (image) {
      URL.revokeObjectURL(image);
    }

    setImage(null);
    setFile(null);
    setResult(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* ---------------- MODE ---------------- */

  const changeMode = (newMode) => {
    setMode(newMode);
    setError("");
    setResult(null);

    if (newMode === "camera") {
      setImage(null);
      setFile(null);
    } else {
      stopCamera();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();

      if (image) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-[#f7faf7] text-gray-900">

      {/* HEADER */}

      <header className="sticky top-0 z-30 flex h-20 items-center border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">

        <button
          onClick={() => navigate("/dashboard")}
          className="mr-4 rounded-xl p-2.5 text-gray-600 transition hover:bg-gray-100"
        >
          <ArrowLeft size={21} />
        </button>

        <div>
          <h1 className="font-semibold">
            Scan Food
          </h1>

          <p className="text-xs text-gray-400">
            AI-powered food recognition
          </p>
        </div>

      </header>

      <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">

        {/* TITLE */}

        <div className="mb-7">

          <div className="mb-2 flex items-center gap-2 text-green-600">
            <ScanLine size={20} />

            <span className="text-sm font-semibold">
              AI Food Recognition
            </span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight">
            What's on your plate?
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Use your camera or upload a food image to
            identify your meal and estimate its nutrition.
          </p>

        </div>

        {/* MAIN GRID */}

        <div className="grid gap-6 lg:grid-cols-5">

          {/* LEFT */}

          <section className="lg:col-span-3">

            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

              {/* MODE SWITCH */}

              <div className="mb-5 grid grid-cols-2 rounded-xl bg-gray-100 p-1">

                <button
                  onClick={() => changeMode("camera")}
                  className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition ${
                    mode === "camera"
                      ? "bg-white text-green-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Camera size={18} />
                  Camera
                </button>

                <button
                  onClick={() => changeMode("upload")}
                  className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition ${
                    mode === "upload"
                      ? "bg-white text-green-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Upload size={18} />
                  Upload
                </button>

              </div>

              {/* CAMERA MODE */}

              {mode === "camera" && !image && (

                <div>

                  <div className="relative overflow-hidden rounded-2xl bg-black">

                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className={`aspect-video w-full object-cover ${
                        cameraOn
                          ? "block"
                          : "hidden"
                      }`}
                    />

                    {!cameraOn && (
                      <div className="flex aspect-video flex-col items-center justify-center px-6 text-center text-white">

                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                          <Camera size={30} />
                        </div>

                        <h3 className="text-lg font-semibold">
                          Camera ready
                        </h3>

                        <p className="mt-2 max-w-sm text-sm text-gray-400">
                          Start your camera and point it
                          at your food.
                        </p>

                      </div>
                    )}

                    {cameraOn && (
                      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                        LIVE
                      </div>
                    )}

                  </div>

                  <div className="mt-4 flex gap-3">

                    {!cameraOn ? (
                      <button
                        onClick={startCamera}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700"
                      >
                        <Camera size={19} />
                        Start Camera
                      </button>
                    ) : (
                      <button
                        onClick={captureImage}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700"
                      >
                        <Camera size={19} />
                        Capture Food
                      </button>
                    )}

                    {cameraOn && (
                      <>
                        <button
                          onClick={switchCamera}
                          title="Switch camera"
                          className="flex items-center justify-center rounded-xl border border-gray-200 px-4 text-gray-600 transition hover:bg-gray-50"
                        >
                          <SwitchCamera size={20} />
                        </button>

                        <button
                          onClick={stopCamera}
                          title="Stop camera"
                          className="flex items-center justify-center rounded-xl border border-red-200 px-4 text-red-500 transition hover:bg-red-50"
                        >
                          <CameraOff size={20} />
                        </button>
                      </>
                    )}

                  </div>

                </div>
              )}

              {/* UPLOAD MODE */}

              {mode === "upload" && !image && (

                <div
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="flex min-h-[390px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-green-200 bg-green-50/40 px-6 text-center transition hover:border-green-400 hover:bg-green-50"
                >

                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-100 text-green-600">
                    <Upload size={34} />
                  </div>

                  <h3 className="text-xl font-semibold">
                    Upload your food image
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                    Select a clear photo of your food
                    from your device.
                  </p>

                  <button
                    type="button"
                    className="mt-7 flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white"
                  >
                    <ImageIcon size={18} />
                    Choose Image
                  </button>

                </div>
              )}

              {/* CAPTURED IMAGE */}

              {image && (

                <div>

                  <div className="relative overflow-hidden rounded-2xl bg-gray-100">

                    <img
                      src={image}
                      alt="Captured food"
                      className="max-h-[500px] w-full object-cover"
                    />

                    <button
                      onClick={resetScan}
                      className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-black/60 text-white backdrop-blur hover:bg-black/80"
                    >
                      <X size={19} />
                    </button>

                  </div>

                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-gray-50 p-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                      <ImageIcon size={18} />
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-medium">
                        {file?.name}
                      </p>

                      <p className="text-xs text-gray-400">
                        Ready for AI analysis
                      </p>

                    </div>

                  </div>

                  <div className="mt-5 flex gap-3">

                    <button
                      onClick={analyzeFood}
                      disabled={analyzing}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-70"
                    >

                      {analyzing ? (
                        <>
                          <Loader2
                            size={19}
                            className="animate-spin"
                          />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <ScanLine size={19} />
                          Analyze Food
                        </>
                      )}

                    </button>

                    <button
                      onClick={resetScan}
                      className="flex items-center justify-center rounded-xl border border-gray-200 px-5 text-gray-600 hover:bg-gray-50"
                    >
                      <RotateCcw size={18} />
                    </button>

                  </div>

                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />

              <canvas
                ref={canvasRef}
                className="hidden"
              />

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

            </div>

          </section>

          {/* RIGHT RESULT */}

          <section className="lg:col-span-2">

            {!result ? (

              <div className="flex h-full min-h-[430px] flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white p-7 text-center shadow-sm">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                  <ScanLine size={28} />
                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  Nutrition results
                </h3>

                <p className="mt-2 max-w-xs text-sm leading-6 text-gray-400">
                  Capture or upload your food and analyze
                  it to see nutrition information.
                </p>

                <div className="mt-7 space-y-3 text-left text-xs text-gray-400">

                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-green-500"
                    />
                    Food identification
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-green-500"
                    />
                    Calorie estimation
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-green-500"
                    />
                    Macronutrient breakdown
                  </div>

                </div>

              </div>

            ) : (

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

                <div className="flex items-start justify-between">

                  <div>

                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 size={18} />
                      <span className="text-xs font-semibold">
                        AI Analysis Complete
                      </span>
                    </div>

                    <h3 className="mt-2 text-2xl font-bold">
                      {result.food_name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-400">
                      Serving: {result.serving}
                    </p>

                  </div>

                  <div className="rounded-xl bg-green-50 px-3 py-2 text-center">

                    <p className="text-lg font-bold text-green-600">
                      {result.confidence}%
                    </p>

                    <p className="text-[10px] text-green-600">
                      confidence
                    </p>

                  </div>

                </div>

                <div className="mt-7 rounded-2xl bg-orange-50 p-5">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                      <Flame size={22} />
                    </div>

                    <div>

                      <p className="text-xs text-orange-600">
                        Estimated Calories
                      </p>

                      <p className="text-3xl font-bold">
                        {result.calories}
                        <span className="ml-1 text-sm font-medium text-gray-400">
                          kcal
                        </span>
                      </p>

                    </div>

                  </div>

                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">

                  <div className="rounded-xl bg-blue-50 p-4 text-center">
                    <Beef
                      size={18}
                      className="mx-auto text-blue-500"
                    />
                    <p className="mt-2 text-lg font-bold">
                      {result.protein}g
                    </p>
                    <p className="text-xs text-gray-400">
                      Protein
                    </p>
                  </div>

                  <div className="rounded-xl bg-yellow-50 p-4 text-center">
                    <Wheat
                      size={18}
                      className="mx-auto text-yellow-500"
                    />
                    <p className="mt-2 text-lg font-bold">
                      {result.carbs}g
                    </p>
                    <p className="text-xs text-gray-400">
                      Carbs
                    </p>
                  </div>

                  <div className="rounded-xl bg-purple-50 p-4 text-center">
                    <Droplets
                      size={18}
                      className="mx-auto text-purple-500"
                    />
                    <p className="mt-2 text-lg font-bold">
                      {result.fat}g
                    </p>
                    <p className="text-xs text-gray-400">
                      Fat
                    </p>
                  </div>

                </div>

                <button
                  onClick={() => navigate("/meals")}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <Plus size={19} />
                  Add to Today's Meals
                </button>

                <button
                  onClick={resetScan}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <RotateCcw size={17} />
                  Scan Another Food
                </button>

              </div>
            )}

          </section>

        </div>

      </main>

    </div>
  );
}