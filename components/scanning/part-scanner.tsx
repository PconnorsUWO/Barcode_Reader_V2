"use client";

import { useState } from "react";
import { Barcode, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CameraModal } from "@/components/scanning/camera-modal";
import { ScanType } from "@/lib/types";
import { BarcodeScanner } from "@/components/scanning/barcode-scanner";

interface PartScannerProps {
  currentLocation: string;
  onPartScanned: (scanData: ScanType) => void;
}

interface ocrResults {
  box1Text: string;
  box2Text?: string;
}

export function PartScanner({ currentLocation, onPartScanned }: PartScannerProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanSuccess = (decodedText: string) => {
    // Create scan data
    const scanData: ScanType = {
      id: Math.random().toString(36).substring(2, 9),
      partNumber: decodedText,
      location: currentLocation,
      scanMethod: "Barcode",
      timestamp: new Date().toISOString(),
    };
    
    // Process the scan
    onPartScanned(scanData);
    
    // Close the scanner
    setIsBarcodeScannerOpen(false);
    

  };

  const handleScanError = (error: string) => {
    console.error("Scanning error:", error);
    // Only show toast for critical errors, not for regular scanning attempts
    if (error.includes("starting") || error.includes("permission")) {
      
      setIsBarcodeScannerOpen(false);
    }
  };

  const handleImageCaptured = async (imageSrc: string, ocrData?: ocrResults) => {
    setIsCameraOpen(false);
    setIsScanning(true);
    
    try {
      // Use the ocrData directly if available
      if (!ocrData || !ocrData.box1Text) {

        setIsScanning(false);
        return;
      }
      
      const scanData: ScanType = {
        id: Math.random().toString(36).substring(2, 9),
        partNumber: ocrData.box1Text, // Use text from box1 as part number
        location: currentLocation,
        scanMethod: "OCR",
        timestamp: new Date().toISOString(),
        vin: ocrData.box2Text || undefined, // Use text from box2 as VIN
      };
      
      onPartScanned(scanData);

    } catch (error) {
      console.error(error);

    } finally {
      setIsScanning(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Scan Part</CardTitle>
          <CardDescription>
            Use barcode scanner or capture label image
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isBarcodeScannerOpen ? (
            <BarcodeScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              onClose={() => setIsBarcodeScannerOpen(false)}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Button
                onClick={() => setIsBarcodeScannerOpen(true)}
                disabled={isScanning}
                size="lg"
                className="h-24 text-lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <Barcode className="h-6 w-6" />
                  <span>Scan Barcode</span>
                </div>
              </Button>
              <Button
                onClick={() => setIsCameraOpen(true)}
                disabled={isScanning}
                variant="outline"
                size="lg"
                className="h-24 text-lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <Camera className="h-6 w-6" />
                  <span>Capture Label</span>
                </div>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onImageCaptured={handleImageCaptured}
      />
    </>
  );
}