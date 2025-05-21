"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { submitScan } from "@/lib/api"; // Assuming submitScan is in this path
import { Send } from "lucide-react";

export function ManualScanEntry() {
  const [partNumber, setPartNumber] = useState("");
  const [location, setLocation] = useState("");
  const [vin, setVin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    if (!partNumber.trim() || !location.trim()) {
      setSubmitStatus({ message: "Part Number and Location are required.", type: "error" });
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        partNumber: partNumber.trim(),
        location: location.trim(),
        vin: vin.trim() || undefined,
      };
      console.log("[ManualScanEntry] Submitting payload:", payload);
      const result = await submitScan(payload);

      if (result.success) {
        setSubmitStatus({ message: `Scan submitted successfully! ID: ${result.data?.scan_id || 'N/A'}`, type: "success" });
        console.log("Manual scan submitted successfully:", result.data);
        // Clear form
        setPartNumber("");
        setLocation("");
        setVin("");
      } else {
        setSubmitStatus({ message: `Error: ${result.error || "Failed to submit scan."}`, type: "error" });
        console.error("Failed to submit manual scan:", result.error);
      }
    } catch (error) {
      setSubmitStatus({ message: "An unexpected error occurred.", type: "error" });
      console.error("Error during manual submission process:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Manual Scan Entry</CardTitle>
        <CardDescription>
          Enter scan details manually and send to the server.
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
          {submitStatus && (
            <p className={`text-sm ${submitStatus.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {submitStatus.message}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? "Sending..." : "Send Scan"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}