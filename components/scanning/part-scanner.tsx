"use client";

import { useState } from "react";
import { Barcode, Camera, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CameraModal } from "@/components/scanning/camera-modal";
import { toast } from "@/hooks/use-toast";
import { ScanType } from "@/lib/types";
import { scanBarcode, scanWithOCR } from "@/lib/scan-utils";

interface PartScannerProps {
  currentLocation: string;
  onPartScanned: (scanData: ScanType) => void;
}

export function PartScanner({ currentLocation, onPartScanned }: PartScannerProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanBarcode = async () => {
    setIsScanning(true);
    try {
      // In a real app, this would connect to a barcode scanner
      const scanResult = await scanBarcode();
      
      const scanData: ScanType = {
        id: Math.random().toString(36).substring(2, 9),
        partNumber: scanResult.partNumber,
        location: currentLocation,
        scanMethod: "Barcode",
        timestamp: new Date().toISOString(),
        status: "Pending",
        scannedBy: "John Doe",
      };
      
      onPartScanned(scanData);
      toast({
        title: "Part Scanned",
        description: `Successfully scanned part #${scanResult.partNumber}`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Scan Failed",
        description: "Unable to scan barcode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleImageCaptured = async (imageSrc: string) => {
    setIsCameraOpen(false);
    setIsScanning(true);
    
    try {
      // Simulate OCR processing
      const ocrResult = await scanWithOCR(imageSrc);
      
      const scanData: ScanType = {
        id: Math.random().toString(36).substring(2, 9),
        partNumber: ocrResult.partNumber,
        location: currentLocation,
        scanMethod: "OCR",
        timestamp: new Date().toISOString(),
        status: "Pending",
        scannedBy: "John Doe",
        vin: ocrResult.vin || undefined,
        imageUrl: imageSrc,
      };
      
      onPartScanned(scanData);
      toast({
        title: "Image Processed",
        description: `Successfully extracted part #${ocrResult.partNumber}`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Processing Failed",
        description: "Unable to process image. Please try again.",
        variant: "destructive",
      });
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              onClick={handleScanBarcode}
              disabled={isScanning}
              size="lg"
              className="h-24 text-lg"
            >
              <div className="flex flex-col items-center gap-2">
                <Barcode className="h-6 w-6" />
                <span>{isScanning ? "Scanning..." : "Scan Barcode"}</span>
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