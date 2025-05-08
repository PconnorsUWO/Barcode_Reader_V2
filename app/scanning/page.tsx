"use client";

import { useState } from "react";
import { LocationScanner } from "@/components/scanning/location-scanner";
import { PartScanner } from "@/components/scanning/part-scanner";
import { ScanPreview } from "@/components/scanning/scan-preview";
import { ScanType } from "@/lib/types";

export default function ScanningPage() {
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [currentScan, setCurrentScan] = useState<ScanType | null>(null);

  const handleLocationScanned = (location: string) => {
    setCurrentLocation(location);
    // Reset any current scan when location changes
    setCurrentScan(null);
  };

  const handlePartScanned = (scanData: ScanType) => {
    setCurrentScan(scanData);
  };

  const handleResetLocation = () => {
    setCurrentLocation(null);
    setCurrentScan(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Parts Scanning</h1>
      </div>

      <div className="grid gap-6">
        <LocationScanner 
          currentLocation={currentLocation} 
          onLocationScanned={handleLocationScanned}
          onResetLocation={handleResetLocation}
        />
        
        {currentLocation && (
          <>
            {!currentScan ? (
              <PartScanner 
                currentLocation={currentLocation}
                onPartScanned={handlePartScanned}
              />
            ) : (
              <ScanPreview 
                scanData={currentScan}
                onScanAgain={() => setCurrentScan(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}