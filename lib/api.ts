import { ScanType } from "@/lib/types";

// base URL for the API
const API_BASE_URL = "https://scans-prod.us-east-2.elasticbeanstalk.com";

// Fetch all scans from the API
export async function fetchScans(): Promise<ScanType[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/scans`);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform data if needed to match ScanType structure
    return data.map((scan: any) => ({
      id: scan.id || scan._id || String(Math.random()).slice(2),
      partNumber: scan.barcode || scan.part_number,
      location: scan.location || "Unknown",
      timestamp: scan.timestamp || scan.created_at || new Date().toISOString(),
      scanMethod: scan.scanMethod || scan.scan_method || "Barcode",
      status: scan.status || "Completed",
      scannedBy: scan.scannedBy || scan.scanned_by || "System",
      vin: scan.vin || undefined,
      imageUrl: scan.imageUrl || scan.image_url
    }));
  } catch (error) {
    console.error("Error fetching scans:", error);
    return mockScanData; 
  }
}

// Simulated API endpoint for submitting a new scan
export async function submitScan(scanData: ScanType): Promise<{ success: boolean }> {
  // In a real app, this would post to your API endpoint
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Scan submitted:", scanData);
      resolve({ success: true });
    }, 1500);
  });
}

// Mock data for scan history
const mockScanData: ScanType[] = [
  {
    id: "abc123",
    partNumber: "LP-2456",
    location: "WH-A123",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    scanMethod: "Barcode",
  },
  {
    id: "def456",
    partNumber: "LP-7890",
    location: "WH-B456",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    scanMethod: "OCR",
    vin: "1HGCM82633A123456"
  },
  {
    id: "ghi789",
    partNumber: "LP-1234",
    location: "WH-C789",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    scanMethod: "Barcode",
  },
  {
    id: "jkl012",
    partNumber: "LP-5678",
    location: "WH-A123",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    scanMethod: "OCR",
    vin: "5XYZU3LB5DG123456"
  }
];

