"use client";

import { useState } from "react";
import { Barcode, MapPin, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarcodeScanner } from "@/components/scanning/barcode-scanner";

interface LocationScannerProps {
  currentLocation: string | null;
  onLocationScanned: (location: string) => void;
  onResetLocation: () => void;
}

export function LocationScanner({ 
  currentLocation, 
  onLocationScanned,
  onResetLocation
}: LocationScannerProps) {
  const [locationInput, setLocationInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const handleLocationScan = () => {
    setIsScanning(true);
  };

  const handleScanSuccess = (decodedText: string) => {
    // Process the scan result
    onLocationScanned(decodedText);
    
    // Close the scanner
    setIsScanning(false);
    
    // Show toast notification

  };

  const handleScanError = (error: string) => {
    console.error("Scanning error:", error);
    // Only show toast for critical errors, not for regular scanning attempts
    if (error.includes("starting") || error.includes("permission")) {

      setIsScanning(false);
    }
  };

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (locationInput.trim()) {
      onLocationScanned(locationInput.trim());
      setLocationInput("");

    }
  };

  if (currentLocation) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Current Location</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onResetLocation}
              className="flex items-center gap-1 h-8"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Change Location</span>
            </Button>
          </div>
          <CardDescription>All parts will be scanned at this location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5 text-primary" />
            <span>{currentLocation}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Scan Location</CardTitle>
        <CardDescription>Start by scanning a location barcode</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleManualEntry} className="flex gap-2">
          <Input 
            placeholder="Enter location manually..." 
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="outline">Set</Button>
        </form>
        
        {isScanning ? (
          <BarcodeScanner 
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
            onClose={() => setIsScanning(false)}
          />
        ) : (
          <div className="flex justify-center">
            <Button 
              onClick={handleLocationScan}
              size="lg" 
              className="gap-2"
            >
              <Barcode className="h-5 w-5" />
              Scan Location Barcode
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}