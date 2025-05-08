import { NextResponse } from 'next/server';
import { ScanType } from '@/lib/types';

// Mock database for demonstration purposes
let mockScans: ScanType[] = [
  {
    id: "abc123",
    partNumber: "LP-2456",
    location: "WH-A123",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    scanMethod: "Barcode",
    status: "Completed",
    scannedBy: "John Doe"
  },
  {
    id: "def456",
    partNumber: "LP-7890",
    location: "WH-B456",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    scanMethod: "OCR",
    status: "Completed",
    scannedBy: "Jane Smith",
    vin: "1HGCM82633A123456"
  }
];

// GET /api/scan - Retrieve all scans
export async function GET() {
  return NextResponse.json(mockScans);
}

// POST /api/scan - Create a new scan
export async function POST(request: Request) {
  try {
    const scanData = await request.json();
    
    // Validate required fields
    if (!scanData.partNumber || !scanData.location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate ID if not provided
    const newScan: ScanType = {
      id: scanData.id || Math.random().toString(36).substring(2, 9),
      partNumber: scanData.partNumber,
      location: scanData.location,
      timestamp: scanData.timestamp || new Date().toISOString(),
      scanMethod: scanData.scanMethod || "Barcode",
      status: "Completed", // Mark as completed when submitted
      scannedBy: scanData.scannedBy || "Unknown User",
      vin: scanData.vin,
      imageUrl: scanData.imageUrl
    };
    
    // In a real app, this would store the scan in a database
    mockScans = [newScan, ...mockScans];
    
    return NextResponse.json(newScan, { status: 201 });
  } catch (error) {
    console.error('Error creating scan:', error);
    return NextResponse.json(
      { error: 'Failed to create scan' },
      { status: 500 }
    );
  }
}