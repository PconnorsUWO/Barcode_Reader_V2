"use client";

import { useRef, useState, useEffect, ChangeEvent } from "react";
import { X, Camera, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { processImageOCR } from "@/lib/api";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageCaptured: (
    imageSrc: string,
    ocrResults?: { box1Text: string; box2Text: string }
  ) => void;
}

type Step = "camera" | "preview";

export function CameraModal({ isOpen, onClose, onImageCaptured }: CameraModalProps) {
  /* ─────────────── Component state ─────────────── */
  const [step, setStep] = useState<Step>("camera");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [partText, setPartText] = useState("");
  const [vinText, setVinText] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ─────────────── Camera lifecycle ─────────────── */
  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      if (isOpen && step === "camera") {
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

  /* ─────────────── Convert canvas to File ─────────────── */
const canvasToFile = async (canvas: HTMLCanvasElement): Promise<File> => {
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], 'capture.jpg', { type: 'image/jpeg' }));
      } else {
        reject(new Error('Could not convert canvas to blob'));
      }
    }, 'image/jpeg');
  });
};


  /* ─────────────── Capture image and process with backend OCR ─────────────── */
  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    setIsProcessing(true);

    // Capture the frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop the stream
    (video.srcObject as MediaStream)?.getTracks().forEach((t) => t.stop());
    setIsCameraActive(false);

    // Get image data
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(imageDataUrl);

    // Convert to File and send to backend OCR
    try {
      const imageFile = await canvasToFile(canvas);
      const ocrResult = await processImageOCR(imageFile);

      if (ocrResult.success) {
        setVinText(ocrResult.vin || "");
        setPartText(ocrResult.partNumber || "");
      } else {
        console.error("OCR processing failed:", ocrResult.error);
        // Keep empty values, user can manually enter
      }
    } catch (error) {
      console.error("Error processing image:", error);
    }

    setStep("preview");
    setIsProcessing(false);
  };

  /* ─────────────── Handlers ─────────────── */
  const handleRetake = () => {
    setStep("camera");
    setCapturedImage(null);
    setPartText("");
    setVinText("");
  };

  const handleConfirm = () => {
    if (!capturedImage) return;

    onImageCaptured(capturedImage, { box1Text: partText, box2Text: vinText });
    handleRetake();
  };

  const handleChange = (key: "vin" | "part") => (e: ChangeEvent<HTMLInputElement>) => {
    if (key === "vin") setVinText(e.target.value);
    else setPartText(e.target.value);
  };

  /* ─────────────── Camera overlay ─────────────── */
  const CameraOverlay = (
    <div className="flex flex-col">
      <div className="aspect-[4/5] bg-black relative">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        
        {/* Viewfinder overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full border-2 border-white/20 flex items-center justify-center">
            <div className="w-3/4 h-1/3 border-2 border-red-500 bg-red-500/10 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                Align text within frame
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 flex justify-center">
        <Button 
          size="lg" 
          onClick={handleCapture} 
          disabled={!isCameraActive || isProcessing} 
          className="rounded-full w-16 h-16 p-0"
        >
          <Camera className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );

  /* ─────────────── Preview overlay ─────────────── */
  const PreviewOverlay = (
    <div className="flex flex-col pt-16 pb-10 px-6">
      {isProcessing ? (
        <div className="text-center py-8">Processing image...</div>
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
                placeholder="VIN (optional)"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Part Number</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md text-sm font-mono"
                value={partText}
                onChange={handleChange('part')}
                placeholder="Part number"
              />
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={handleRetake}>
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
          if (isCameraActive && videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
          }
          handleRetake();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <DialogTitle>
              {step === "camera" && "Capture Image"}
              {step === "preview" && "Confirm Details"}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-b-lg">
          {step === "preview" ? PreviewOverlay : CameraOverlay}

          {/* Hidden canvas for image capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
