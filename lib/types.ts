import { Html5QrcodeSupportedFormats } from "html5-qrcode";

export interface ScanType {
  id: string;
  partNumber: string;
  location: string;
  timestamp: string;
  scanMethod: "Barcode" | "OCR";
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
