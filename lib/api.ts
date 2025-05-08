import { ScanType } from "@/lib/types";

// Simulated API endpoint for fetching scan history
export async function fetchScans(): Promise<ScanType[]> {
  // In a real app, this would be a fetch call to your API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockScanData);
    }, 1000);
  });
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
    status: "Completed",
    scannedBy: "John Doe"
  },
  {
    id: "def456",
    partNumber: "LP-7890",
    location: "WH-B456",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    scanMethod: "OCR",
    status: "Completed",
    scannedBy: "Jane Smith",
    vin: "1HGCM82633A123456"
  },
  {
    id: "ghi789",
    partNumber: "LP-1234",
    location: "WH-C789",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    scanMethod: "Barcode",
    status: "Failed",
    scannedBy: "John Doe"
  },
  {
    id: "jkl012",
    partNumber: "LP-5678",
    location: "WH-A123",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    scanMethod: "OCR",
    status: "Completed",
    scannedBy: "Jane Smith",
    vin: "5XYZU3LB5DG123456"
  }
];