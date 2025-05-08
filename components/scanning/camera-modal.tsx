"use client";

import { useRef, useState, useEffect } from "react";
import { X, Camera, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageCaptured: (imageSrc: string) => void;
}

export function CameraModal({ isOpen, onClose, onImageCaptured }: CameraModalProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      if (isOpen && !capturedImage) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
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
        stream.getTracks().forEach(track => track.stop());
        setIsCameraActive(false);
      }
    };
  }, [isOpen, capturedImage]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL("image/png");
        setCapturedImage(imageSrc);
        
        // Stop camera after capture
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setIsCameraActive(false);
        }
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onImageCaptured(capturedImage);
      setCapturedImage(null);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    // Camera will restart due to useEffect
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        if (isCameraActive && videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        setCapturedImage(null);
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <DialogTitle>Capture Label Image</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="relative overflow-hidden rounded-b-lg">
          {capturedImage ? (
            <div className="flex flex-col">
              <div className="aspect-video bg-black flex items-center justify-center">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="p-4 flex justify-between">
                <Button variant="outline" onClick={handleRetake}>
                  Retake
                </Button>
                <Button onClick={handleConfirm}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="aspect-video bg-black relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-primary/50 border-dashed m-8 pointer-events-none" />
              </div>
              <div className="p-4 flex justify-center">
                <Button 
                  size="lg" 
                  onClick={handleCapture}
                  disabled={!isCameraActive}
                  className="rounded-full w-16 h-16 p-0"
                >
                  <Camera className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
}