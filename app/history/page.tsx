"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchScans } from "@/lib/api";
import { ScanType } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScans = async () => {
      try {
        const data = await fetchScans();
        setScans(data);
      } catch (error) {
        console.error("Failed to fetch scan history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadScans();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Scan History</h1>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
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
            </Card>
          ))}
        </div>
      ) : scans.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scans.map((scan) => (
            <Card key={scan.id} className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Part #{scan.partNumber}</CardTitle>
                  <Badge variant={scan.status === "Completed" ? "success" : "default"}>
                    {scan.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
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
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Scanned by:</span>
                  <span>{scan.scannedBy}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{formatDate(scan.timestamp)}</span>
                </div>
              </CardContent>
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