import { BarcodeResult, OCRResult } from "@/lib/types";

// Simulate barcode scanning
export async function scanBarcode(): Promise<BarcodeResult> {
  return new Promise((resolve) => {
    // Simulate processing time
    setTimeout(() => {
      // Generate a mock part number
      const partNumber = `LP-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      resolve({
        partNumber
      });
    }, 1500);
  });
}

// Simulate OCR processing
export async function scanWithOCR(imageSrc: string): Promise<OCRResult> {
  return new Promise((resolve) => {
    // Simulate processing time
    setTimeout(() => {
      // Generate mock data
      const partNumber = `LP-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      // Sometimes include a VIN (about 70% of the time)
      const includeVin = Math.random() > 0.3;
      const vin = includeVin ? generateMockVIN() : undefined;
      
      resolve({
        partNumber,
        vin
      });
    }, 2500);
  });
}

// Generate a mock VIN (Vehicle Identification Number)
function generateMockVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  
  // VINs are 17 characters
  for (let i = 0; i < 17; i++) {
    vin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return vin;
}