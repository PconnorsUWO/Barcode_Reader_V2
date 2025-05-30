"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScanSuccess, onScanError, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasScannedRef = useRef(false);

  // Initialize scanner when component mounts
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (containerRef.current) {
      scannerRef.current = new Html5Qrcode("scanner-container");
      
      // Start scanner after initialization
      startScanner();
    }
    
    // Cleanup on unmount
    return () => {
      stopScanner(true);
    };
  }, []);
  
  const startScanner = () => {
    if (!scannerRef.current || isStarted) return;
    
    setIsStarted(true);
    
    scannerRef.current
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Handle successful scan
          if (hasScannedRef.current) return;
          
          // Mark as scanned to prevent duplicate processing
          hasScannedRef.current = true;
          
          // Stop scanner and then call success callback
          stopScanner();
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Silent errors during normal scanning
          console.debug("Scanning process:", errorMessage);
        }
      )
      .catch((err) => {
        const errMsg = `Error starting scanner: ${err}`;
        setError(errMsg);
        setIsStarted(false);
        if (onScanError) {
          onScanError(errMsg);
        }
      });
  };
  
  const stopScanner = (isUnmounting = false) => {
    if (scannerRef.current && isStarted) {
      scannerRef.current.stop()
        .then(() => {
          setIsStarted(false);
        })
        .catch(err => {
          console.error("Error stopping scanner:", err);
          // Force the state update even if stopping fails
          setIsStarted(false);
        });
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <div className="relative flex flex-col items-center">
      <Button 
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="absolute right-0 top-0 z-10"
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="mb-4 text-center text-sm text-muted-foreground">
        Position a barcode in the scanner view
      </div>

      {error && (
        <div className="mb-4 text-center text-sm text-destructive">{error}</div>
      )}

      <div 
        id="scanner-container" 
        ref={containerRef} 
        className="w-full max-w-md aspect-square rounded-lg overflow-hidden border-2 border-dashed"
      ></div>
    </div>
  );
}