"use client";

import { useRef, useState, useEffect, ChangeEvent } from "react";
import { X, Camera, CheckCircle, SkipForward } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import * as Tesseract from "tesseract.js";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageCaptured: (
    imageSrc: string,
    ocrResults?: { box1Text: string; box2Text: string }
  ) => void;
}

/** Single scanning box expressed as fractions (0–1) of width/height */
const SCAN_BOX = { x: 0.1, y: 0.35, width: 0.8, height: 0.25 } as const;

type Step = "part" | "vin" | "preview";

export function CameraModal({ isOpen, onClose, onImageCaptured }: CameraModalProps) {
  /* ─────────────── Component state ─────────────── */
  const [step, setStep] = useState<Step>("part");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [partImage, setPartImage] = useState<string | null>(null);
  const [vinImage, setVinImage] = useState<string | null>(null);
  const [partText, setPartText] = useState("");
  const [vinText, setVinText] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement>(null);
  const boxCanvasRef = useRef<HTMLCanvasElement>(null);

  /* ─────────────── Camera lifecycle ─────────────── */
  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      if (isOpen && (step === "part" || step === "vin")) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsCameraActive(true);
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
        }
      }
    };

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setIsCameraActive(false);
      }
    };
  }, [isOpen, step]);

  /* ─────────────── OCR helper ─────────────── */
  const runOcr = async (canvas: HTMLCanvasElement): Promise<string> => {
    try {
      const result = await Tesseract.recognize(canvas, "eng", {
        logger: (m) => console.log("OCR progress:", m),
      });
      return result.data.text.trim();
    } catch (err) {
      console.error("OCR error:", err);
      return "";
    }
  };

  /* ─────────────── Capture current frame & OCR ─────────────── */
  const handleCapture = async () => {
    if (!videoRef.current || !frameCanvasRef.current || !boxCanvasRef.current) return;

    const video = videoRef.current;
    const frameCanvas = frameCanvasRef.current;
    const boxCanvas = boxCanvasRef.current;

    setIsProcessing(true);

    // Draw entire frame (kept so we can return something on confirm)
    frameCanvas.width = video.videoWidth;
    frameCanvas.height = video.videoHeight;
    frameCanvas.getContext("2d")?.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);

    // Extract scan box region into its own canvas for OCR
    const sx = SCAN_BOX.x * video.videoWidth;
    const sy = SCAN_BOX.y * video.videoHeight;
    const sWidth = SCAN_BOX.width * video.videoWidth;
    const sHeight = SCAN_BOX.height * video.videoHeight;

    boxCanvas.width = sWidth;
    boxCanvas.height = sHeight;
    boxCanvas.getContext("2d")?.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

    // Stop the stream so the camera view freezes (gives visual feedback)
    (video.srcObject as MediaStream)?.getTracks().forEach((t) => t.stop());
    setIsCameraActive(false);

    const ocrText = (await runOcr(boxCanvas)).replace(/\s+/g, "");

    if (step === "part") {
      setPartImage(frameCanvas.toDataURL("image/png"));
      setPartText(ocrText);
      setStep("vin");
    } else if (step === "vin") {
      setVinImage(frameCanvas.toDataURL("image/png"));
      setVinText(ocrText);
      setStep("preview");
    }

    setIsProcessing(false);
  };

  /* ─────────────── Handlers ─────────────── */
  const handleSkipVin = () => {
    setVinText("");
    setStep("preview");
  };

  const handleRetakeAll = () => {
    setStep("part");
    setPartImage(null);
    setVinImage(null);
    setPartText("");
    setVinText("");
  };

  const handleConfirm = () => {
    if (!partImage) return; // should never happen

    onImageCaptured(partImage, { box1Text: partText, box2Text: vinText }); // Changed from { box1Text: vinText, box2Text: partText }
    handleRetakeAll();
    // onClose(); // No explicit onClose needed here as PartScanner's handleImageCaptured will close it
  };

  const handleChange = (key: "vin" | "part") => (e: ChangeEvent<HTMLInputElement>) => {
    if (key === "vin") setVinText(e.target.value);
    else setPartText(e.target.value);
  };

  /* ─────────────── Shared camera overlay ─────────────── */
  const CameraOverlay = (
    <div className="flex flex-col">
      <div className="aspect-[4/5] bg-black relative">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

        {/* Scan box */}
        <div
          className="absolute border-2 border-red-500 pointer-events-none"
          style={{
            left: `${SCAN_BOX.x * 100}%`,
            top: `${SCAN_BOX.y * 100}%`,
            width: `${SCAN_BOX.width * 100}%`,
            height: `${SCAN_BOX.height * 100}%`,
          }}
        />
      </div>

      <div className="p-4 flex justify-center gap-4">
        {step === "vin" && (
          <Button variant="outline" onClick={handleSkipVin} disabled={isProcessing}>
            <SkipForward className="h-4 w-4 mr-1" /> Skip VIN
          </Button>
        )}
        <Button size="lg" onClick={handleCapture} disabled={!isCameraActive || isProcessing} className="rounded-full w-16 h-16 p-0">
          <Camera className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );

/* ─────────────── Preview overlay ─────────────── */
const PreviewOverlay = (
  <div className="flex flex-col pt-16 pb-10 px-6">
    {isProcessing ? (
      <div className="text-center py-8">Processing OCR…</div>
    ) : (
      <>
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium block mb-1">VIN</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md text-sm font-mono"
              value={vinText}
              onChange={handleChange('vin')}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">
              Part Number
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md text-sm font-mono"
              value={partText}
              onChange={handleChange('part')}
            />
          </div>
        </div>

        {/* Add margin-top to keep this row clear of the inputs */}
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={handleRetakeAll}>
            Retake
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>
            <CheckCircle className="h-4 w-4 mr-2" /> Confirm
          </Button>
        </div>
      </>
    )}
  </div>
);
  /* ─────────────── Component render ─────────────── */
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // Cleanup when closing
          if (isCameraActive && videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
          }
          handleRetakeAll();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <DialogTitle>
              {step === "part" && "Scan Part Number"}
              {step === "vin" && "Scan VIN (optional)"}
              {step === "preview" && "Confirm Details"}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-b-lg">
          {step === "preview" ? PreviewOverlay : CameraOverlay}

          {/* Hidden canvases */}
          <canvas ref={frameCanvasRef} className="hidden" />
          <canvas ref={boxCanvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
