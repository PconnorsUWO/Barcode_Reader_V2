"use client";

import { useEffect, useState } from "react";
import { Clock, Trash2 } from "lucide-react"; // Import Trash2 icon
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // Import CardFooter
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button"; // Import Button
import { fetchScans, deleteScanById, deletePartByPartNumber } from "@/lib/api"; // Import delete functions
import { ScanType } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null); // To show loading state on button

  useEffect(() => {
    const loadScans = async () => {
      setLoading(true);
      try {
        const data = await fetchScans(5);
        setScans(data);
      } catch (error) {
        console.error("Failed to fetch scan history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadScans();
  }, []);

  const handleDeleteScanAndPart = async (scanId: string, partId: string) => {
    setDeletingId(scanId);
    try {
      // First, delete the scan
      const scanDeleteResult = await deleteScanById(scanId);
      if (!scanDeleteResult.success) {
        console.error("Failed to delete scan:", scanDeleteResult.error);
        // Optionally, show a toast notification for scan deletion failure
        alert(`Failed to delete scan: ${scanDeleteResult.error}`);
        setDeletingId(null);
        return;
      }

      // If scan deletion is successful, attempt to delete the part
      // Note: This will delete the part even if other scans (not visible here) might be associated with it.
      // Adjust logic if a part should only be deleted if no scans link to it.
      const partDeleteResult = await deletePartByPartNumber(partId);
      if (!partDeleteResult.success) {
        console.error("Failed to delete part (scan was deleted):", partDeleteResult.error);
        // Optionally, show a toast notification for part deletion failure
        alert(`Scan deleted, but failed to delete part: ${partDeleteResult.error}`);
      }

      // Update UI by removing the scan
      setScans((prevScans) => prevScans.filter((scan) => scan.id !== scanId));
    } catch (error) {
      console.error("Error during delete operation:", error);
      alert(`An error occurred: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Scan History</h1>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(5)].map((_, i) => ( // Adjusted skeleton to 5
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="pt-2 flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : scans.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scans.map((scan) => (
            <Card key={scan.id} className="overflow-hidden transition-all hover:shadow-md flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Part #{scan.partNumber}</CardTitle>
                  <Badge variant={scan.status === "In Stock" ? "success" : "default"}>
                    {scan.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 flex-grow">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Location:</span>
                  <span>{scan.location}</span>
                </div>
                {scan.vin && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">VIN:</span>
                    <span className="font-mono">{scan.vin}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm pt-2 border-t mt-2">
                  <span className="text-muted-foreground">Scanned by:</span>
                  <span>{scan.scannedBy || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{formatDate(scan.timestamp)}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      disabled={deletingId === scan.id}
                    >
                      {deletingId === scan.id ? "Deleting..." : <><Trash2 className="mr-2 h-4 w-4" /> Delete</>}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will permanently delete scan ID {scan.id} and part number {scan.partNumber}. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deletingId === scan.id}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteScanAndPart(scan.id, scan.partNumber)}
                        disabled={deletingId === scan.id}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {deletingId === scan.id ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">No Scan History</h2>
          <p className="text-muted-foreground mb-6">
            Once you start scanning parts, they will appear here.
          </p>
        </Card>
      )}
    </div>
  );
}