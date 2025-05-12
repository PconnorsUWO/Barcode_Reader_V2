"use client";

import { Edit, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ScanType } from "@/lib/types";
import { useState } from "react";
import { submitScan } from "@/lib/api";

interface ScanPreviewProps {
  scanData: ScanType;
  onScanAgain: () => void;
}

export function ScanPreview({ scanData, onScanAgain }: ScanPreviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    partNumber: scanData.partNumber,
    vin: scanData.vin || "",
  });

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Changes Saved",
      description: "Scan data has been updated.",
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, this would send data to your API
      await submitScan({
        ...scanData,
        partNumber: editedData.partNumber,
        vin: editedData.vin || undefined,
      });
      
      toast({
        title: "Scan Submitted",
        description: "The scan has been successfully recorded.",
      });
      
      // Return to scanning view
      onScanAgain();
    } catch (error) {
      console.error(error);
      toast({
        title: "Submission Failed",
        description: "Unable to submit scan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/5 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Scan Preview</CardTitle>
          <div className="text-sm font-medium text-muted-foreground">
            Scan Method: {scanData.scanMethod}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 pb-2">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partNumber">Part Number</Label>
              <Input
                id="partNumber"
                value={editedData.partNumber}
                onChange={(e) => setEditedData({ ...editedData, partNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vin">VIN (Optional)</Label>
              <Input
                id="vin"
                value={editedData.vin}
                onChange={(e) => setEditedData({ ...editedData, vin: e.target.value })}
                placeholder="Vehicle Identification Number"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Part Number</span>
              <span className="text-lg font-bold">{editedData.partNumber}</span>
            </div>
            
            {(editedData.vin || scanData.vin) && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">VIN</span>
                <span className="font-mono">{editedData.vin || scanData.vin}</span>
              </div>
            )}
            
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Location</span>
              <span>{scanData.location}</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-2 pt-4 pb-4 border-t">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={onScanAgain}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Scan Again
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Sending..." : "Send"}
              </Button>
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}