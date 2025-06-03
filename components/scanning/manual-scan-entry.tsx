"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { submitScanFireAndForget } from "@/lib/api";
import { Send } from "lucide-react";

export function ManualScanEntry() {
  const [partNumber, setPartNumber] = useState("");
  const [location, setLocation] = useState("");
  const [vin, setVin] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!partNumber.trim() || !location.trim()) {
      alert("Part Number and Location are required.");
      return;
    }

    const payload = {
      partNumber: partNumber.trim(),
      location: location.trim(),
      vin: vin.trim() || undefined,
    };

    console.log("[ManualScanEntry] Fire-and-forget submission:", payload);
    
    // Submit without waiting
    submitScanFireAndForget(payload);
    
    // Clear form immediately
    setPartNumber("");
    setLocation("");
    setVin("");
    
    // Simple feedback
    alert("Scan submitted!");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Manual Scan Entry</CardTitle>
        <CardDescription>
          Enter scan details manually and send to the server instantly.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partNumber">Part Number</Label>
            <Input
              id="partNumber"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value.toUpperCase())}
              placeholder="Enter part number"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value.toUpperCase())}
              placeholder="Enter location"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vin">VIN (Optional)</Label>
            <Input
              id="vin"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder="17-character alphanumeric"
              maxLength={17}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            <Send className="h-4 w-4 mr-2" />
            Send Scan
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}