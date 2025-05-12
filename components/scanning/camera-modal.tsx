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
import * as Tesseract from 'tesseract.js';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageCaptured: (imageSrc: string, ocrResults?: { box1Text: string; box2Text: string }) => void;
}

// Define the fixed bounding boxes
const BOUNDING_BOXES = [
  { id: 'box1', x: 100, y: 80, width: 400, height: 60 },
  { id: 'box2', x: 100, y: 280, width: 400, height: 60 }
];

export function CameraModal({ isOpen, onClose, onImageCaptured }: CameraModalProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<{ box1Text: string; box2Text: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const box1CanvasRef = useRef<HTMLCanvasElement>(null);
  const box2CanvasRef = useRef<HTMLCanvasElement>(null);

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

  // Process a cropped region using Tesseract OCR
  const processRegion = async (canvas: HTMLCanvasElement, boxId: string): Promise<string> => {
    try {
      const result = await Tesseract.recognize(
        canvas.toDataURL('image/png'),
        'eng',
        { logger: m => console.log(`OCR progress (${boxId}):`, m) }
      );
      return result.data.text.trim();
    } catch (err) {
      console.error(`OCR error for ${boxId}:`, err);
      return '';
    }
  };

  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current && box1CanvasRef.current && box2CanvasRef.current) {
      setIsProcessing(true);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const box1Canvas = box1CanvasRef.current;
      const box2Canvas = box2CanvasRef.current;
      
      // Capture full frame
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL("image/png");
        setCapturedImage(imageSrc);
        
        // Calculate scaling factor between display size and actual video dimensions
        const scaleX = video.videoWidth / video.offsetWidth;
        const scaleY = video.videoHeight / video.offsetHeight;
        
        // Extract and process box 1
        const box1 = BOUNDING_BOXES[0];
        box1Canvas.width = box1.width * scaleX;
        box1Canvas.height = box1.height * scaleY;
        const box1Context = box1Canvas.getContext("2d");
        if (box1Context) {
          box1Context.drawImage(
            video, 
            box1.x * scaleX, box1.y * scaleY, box1.width * scaleX, box1.height * scaleY,
            0, 0, box1Canvas.width, box1Canvas.height
          );
        }
        
        // Extract and process box 2
        const box2 = BOUNDING_BOXES[1];
        box2Canvas.width = box2.width * scaleX;
        box2Canvas.height = box2.height * scaleY;
        const box2Context = box2Canvas.getContext("2d");
        if (box2Context) {
          box2Context.drawImage(
            video, 
            box2.x * scaleX, box2.y * scaleY, box2.width * scaleX, box2.height * scaleY,
            0, 0, box2Canvas.width, box2Canvas.height
          );
        }
        
        // Stop the camera stream
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setIsCameraActive(false);
        }
        
        // Process OCR on the extracted regions
        try {
          const [box1Text, box2Text] = await Promise.all([
            processRegion(box1Canvas, 'box1'),
            processRegion(box2Canvas, 'box2')
          ]);
          
          const results = { box1Text, box2Text };
          setOcrResults(results);
          setIsProcessing(false);
        } catch (error) {
          console.error("OCR processing error:", error);
          setIsProcessing(false);
        }
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onImageCaptured(capturedImage, ocrResults || { box1Text: '', box2Text: '' });
      setCapturedImage(null);
      setOcrResults(null);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setOcrResults(null);
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
        setOcrResults(null);
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
              <div className="p-4">
                {isProcessing ? (
                  <div className="text-center py-2">Processing OCR...</div>
                ) : ocrResults && (
                  <div className="mb-4 space-y-2">
                    <div className="p-2 border rounded-md">
                      <p className="text-sm font-medium">Box 1 Text:</p>
                      <p className="font-mono text-sm bg-muted p-1 rounded">{ocrResults.box1Text || "No text detected"}</p>
                    </div>
                    <div className="p-2 border rounded-md">
                      <p className="text-sm font-medium">Box 2 Text:</p>
                      <p className="font-mono text-sm bg-muted p-1 rounded">{ocrResults.box2Text || "No text detected"}</p>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleRetake}>
                    Retake
                  </Button>
                  <Button onClick={handleConfirm} disabled={isProcessing}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm
                  </Button>
                </div>
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
                
                {/* Bounding box overlays */}
                {BOUNDING_BOXES.map((box, index) => (
                  <div
                    key={index}
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
                  disabled={!isCameraActive}
                  className="rounded-full w-16 h-16 p-0"
                >
                  <Camera className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={box1CanvasRef} className="hidden" />
          <canvas ref={box2CanvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
}