"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { X, Camera, CheckCircle, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  performOcrOnRegions,
  OcrResults,
  OcrInputDimensions,
  OCR_BOUNDING_BOXES,
} from "@/lib/ocr-service";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageCaptured: (
    imageSrc: string,
    ocrResults?: OcrResults
  ) => void;
  showGrid?: boolean;
}

export function CameraModal({
  isOpen,
  onClose,
  onImageCaptured,
  showGrid = true,
}: CameraModalProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<OcrResults | null>(null);
  const [gridVisible, setGridVisible] = useState(showGrid);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      if (isOpen && !capturedImage) {
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
        stream.getTracks().forEach((track) => track.stop());
        setIsCameraActive(false);
      }
    };
  }, [isOpen, capturedImage]);

  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      setIsProcessing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // 1) draw frame
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return setIsProcessing(false);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 2) take the dataURL
      const imageSrc = canvas.toDataURL("image/png");
      setCapturedImage(imageSrc);

      // 3) stop stream
      const stream = video.srcObject as MediaStream;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setIsCameraActive(false);

      // 4) build dimensions BEFORE OCR using getBoundingClientRect
      const videoRect = video.getBoundingClientRect();
      const dimensions: OcrInputDimensions = {
        videoStreamWidth:  video.videoWidth,
        videoStreamHeight: video.videoHeight,
        videoDisplayWidth: Math.round(videoRect.width),
        videoDisplayHeight: Math.round(videoRect.height),
      };

      // 5) call OCR with (canvas, dimensions)
      try {
        const results = await performOcrOnRegions(canvas, dimensions);
        setOcrResults(results);
      } catch (err) {
        console.error("OCR error:", err);
        setOcrResults({ box1Text: "OCR Error", box2Text: "OCR Error" });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onImageCaptured(capturedImage, ocrResults || { box1Text: "", box2Text: "" });
      setCapturedImage(null);
      setOcrResults(null);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setOcrResults(null);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (isCameraActive && videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            setIsCameraActive(false);
          }
          setCapturedImage(null);
          setOcrResults(null);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md p-0 h-[80vh] flex flex-col">
        <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>Capture Label Image</DialogTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGridVisible((prev) => !prev)}
                title={gridVisible ? "Hide Grid" : "Show Grid"}
              >
                {gridVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} title="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-b-lg flex-grow">
          {capturedImage ? (
            <div className="flex flex-col h-full">
              <div className="bg-black flex items-center justify-center flex-grow relative">
                <Image
                  src={capturedImage}
                  alt="Captured"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
              <div className="p-4">
                {isProcessing ? (
                  <div className="text-center py-2">Processing OCR...</div>
                ) : (
                  ocrResults && (
                    <div className="mb-4 space-y-2">
                      <div className="p-2 border rounded-md">
                        <p className="text-sm font-medium">Box 1 Text:</p>
                        <p className="font-mono text-sm bg-muted p-1 rounded break-all">
                          {ocrResults.box1Text || "No text detected"}
                        </p>
                      </div>
                      <div className="p-2 border rounded-md">
                        <p className="text-sm font-medium">Box 2 Text:</p>
                        <p className="font-mono text-sm bg-muted p-1 rounded break-all">
                          {ocrResults.box2Text || "No text detected"}
                        </p>
                      </div>
                    </div>
                  )
                )}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleRetake} disabled={isProcessing}>
                    Retake
                  </Button>
                  <Button onClick={handleConfirm} disabled={isProcessing}>
                    <CheckCircle className="h-4 w-4 mr-2" /> Confirm
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="bg-black relative flex-grow">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {gridVisible && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px)," +
                        "linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)",
                      backgroundSize: "40px 40px",
                    }}
                  />
                )}
                {/* Use imported OCR_BOUNDING_BOXES for rendering overlays */}
                {OCR_BOUNDING_BOXES.map((box) => (
                  <div
                    key={box.id} // Use box.id as key
                    className="absolute border-2 border-red-500 pointer-events-none"
                    style={{
                      left: `${box.x}px`,
                      top: `${box.y}px`,
                      width: `${box.width}px`,
                      height: `${box.height}px`,
                    }}
                  />
                ))}
              </div>
              <div className="p-4 flex justify-center">
                <Button
                  size="lg"
                  onClick={handleCapture}
                  disabled={!isCameraActive || isProcessing}
                  className="rounded-full w-16 h-16 p-0"
                  aria-label="Capture image"
                >
                  <Camera className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}
          {/* Hidden canvas used for full image capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
