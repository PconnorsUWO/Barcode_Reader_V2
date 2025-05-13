import { Html5QrcodeSupportedFormats } from "html5-qrcode";

export interface ScanType {
  id: string;
  partNumber: string;
  location: string;
  timestamp: string;
  scanMethod: "Barcode" | "OCR";
  status?: string;   // Add this property
  scannedBy?: string;  // Add this property
  imageUrl?: string;  // Add this property
  vin?: string;
}

export interface BarcodeResult {
  partNumber: string;
}

export interface OCRResult {
  partNumber: string;
  vin?: string;
}

export interface QrCodeFormat {
  format: Html5QrcodeSupportedFormats;
  displayName: string;
}
