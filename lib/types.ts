export interface ScanType {
  id: string;
  partNumber: string;
  location: string;
  timestamp: string;
  scanMethod: "Barcode" | "OCR";
  status: "Pending" | "Completed" | "Failed";
  scannedBy: string;
  vin?: string;
  imageUrl?: string;
}

export interface BarcodeResult {
  partNumber: string;
}

export interface OCRResult {
  partNumber: string;
  vin?: string;
}