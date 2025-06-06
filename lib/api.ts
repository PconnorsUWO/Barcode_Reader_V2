import { ScanType } from "@/lib/types";

// Use relative URL when deployed with Flask
// const API_BASE_URL = "https://7e50-2607-fea8-439d-ba00-941f-7d50-a1d9-1335.ngrok-free.app/api";
const API_BASE_URL = "https://www.rfscans.ca/api";

// Fetch scans from the API
export async function fetchScans(limit?: number): Promise<ScanType[]> {
  try {
    let url = `${API_BASE_URL}/scans`;
    if (limit !== undefined && limit > 0) {
      url += `?limit=${limit}`;
    }
    const response = await fetch(url, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform data to match ScanType structure
    return data.map((scan: any) => ({
      id: String(scan.id), // Ensure id is a string
      partNumber: scan.part_number,
      location: scan.location,
      timestamp: scan.date_added, // API uses date_added
      status: scan.scan_type === "IN" ? "In Stock" : scan.scan_type, // Map scan_type to status
      vin: scan.vin || undefined,
      // Add other ScanType fields if necessary, with defaults or from API
      scannedBy: scan.scanned_by || "N/A", // Example if API provides it
      scanMethod: scan.scan_method || "Barcode", // Example
    }));
  } catch (error) {
    console.error("Error fetching scans:", error);
    return mockScanData.slice(0, limit || mockScanData.length); 
  }
}

// Interface for the data structure expected by the submitScan function
interface SubmitScanPayload {
  partNumber: string;
  location: string;
  vin?: string;
}

export async function submitScan(payload: SubmitScanPayload): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const backendPayload = {
      part_number: payload.partNumber,
      location: payload.location,
      vin: payload.vin || null, // Send null if VIN is not present or empty
    };

    console.log("[API] Attempting to submit scan. URL:", `${API_BASE_URL}/send_scan`, "Payload:", backendPayload); // Added log

    const response = await fetch(`${API_BASE_URL}/send_scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(backendPayload),
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
      }
      console.error("Error submitting scan:", errorMessage);
      return { success: false, error: errorMessage };
    }

    const responseData = await response.json();
    console.log("Scan submitted successfully:", responseData);
    return { success: true, data: responseData };

  } catch (error) {
    console.error("[API] Fetch error in submitScan:", error); // Enhanced log
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// Fire-and-forget submission for fast scanning
export function submitScanFireAndForget(payload: SubmitScanPayload): void {
  const backendPayload = {
    part_number: payload.partNumber,
    location: payload.location,
    vin: payload.vin || null,
  };

  console.log("[API] Fire-and-forget scan submission:", backendPayload);

  // Don't await this - fire and forget
  fetch(`${API_BASE_URL}/send_scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    },
    body: JSON.stringify(backendPayload),
  }).then(response => {
    if (response.ok) {
      console.log("[API] Scan submitted successfully (fire-and-forget)");
    } else {
      console.warn("[API] Scan submission may have failed (fire-and-forget):", response.status);
    }
  }).catch(error => {
    console.warn("[API] Scan submission error  (fire-and-forget):", error);
  });
}

// Delete a scan by its ID
export async function deleteScanById(scanId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/scan/${scanId}`, {
      method: 'DELETE',
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Ignore if response is not JSON (e.g., for 204 No Content)
      }
      if (response.status === 204) { // Successfully deleted, no content
        return { success: true };
      }
      console.error("Error deleting scan:", errorMessage);
      return { success: false, error: errorMessage };
    }
    // Handle 204 No Content specifically, as it might not have a JSON body
    if (response.status === 204) {
        return { success: true };
    }

    // For other success statuses that might return data (though DELETE usually doesn't)
    // const responseData = await response.json(); 
    // console.log("Scan deleted successfully:", responseData);
    return { success: true };

  } catch (error) {
    console.error("[API] Fetch error in deleteScanById:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// Delete a part by its part number
export async function deletePartByPartNumber(partID: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/part/number/${partID}`, {
      method: 'DELETE',
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Ignore if response is not JSON
      }
      if (response.status === 204) { // Successfully deleted, no content
        return { success: true };
      }
      console.error("Error deleting part:", errorMessage);
      return { success: false, error: errorMessage };
    }
     // Handle 204 No Content specifically
    if (response.status === 204) {
        return { success: true };
    }
    return { success: true };

  } catch (error) {
    console.error("[API] Fetch error in deletePartByPartNumber:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// Fetch vehicle by VIN
export async function fetchVehicleByVin(vin: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/vehicle/${vin.toUpperCase()}`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Ignore if response is not JSON
      }
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return { success: true, data: data.vehicle };
  } catch (error) {
    console.error("[API] Fetch error in fetchVehicleByVin:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// Fetch parts by VIN
export async function fetchPartsByVin(vin: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/vehicle/${vin.toUpperCase()}/parts`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Ignore if response is not JSON
      }
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return { success: true, data: data.parts };
  } catch (error) {
    console.error("[API] Fetch error in fetchPartsByVin:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// Fetch vehicles by part number
export async function fetchVehiclesByPartNumber(partNumber: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/part/${partNumber}/vehicles`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Ignore if response is not JSON
      }
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return { success: true, data: data.vehicles };
  } catch (error) {
    console.error("[API] Fetch error in fetchVehiclesByPartNumber:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// Download inventory report
export async function downloadInventoryReport(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/reports/generate_inventory_excel`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Ignore if response is not JSON
      }
      return { success: false, error: errorMessage };
    }

    // Create blob from response
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `inventory_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true };
  } catch (error) {
    console.error("[API] Fetch error in downloadInventoryReport:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function processImageOCR(imageFile: File): Promise<{ success: boolean; vin?: string; partNumber?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    console.log("[API] Attempting to process image via OCR. URL:", `${API_BASE_URL}/ocr/process_image`);

    const response = await fetch(`${API_BASE_URL}/ocr/process_image`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true'
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Ignore if response is not JSON
      }
      console.error("Error processing image:", errorMessage);
      return { success: false, error: errorMessage };
    }

    const responseData = await response.json();
    console.log("Image processed successfully:", responseData);
    return { 
      success: true, 
      vin: responseData.vin, 
      partNumber: responseData.part_number 
    };

  } catch (error) {
    console.error("[API] Fetch error in processImageOCR:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
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

// ─────────────────────────────────────────────────────────────────────────────
// Fetch *all* parts in the DB
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchAllParts(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/parts`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch { /* non-JSON */ }
      return { success: false, error: errorMessage };
    }

    const data = await response.json();           // { status: 'success', parts: [...] }
    return { success: true, data: data.parts };
  } catch (error) {
    console.error("[API] Fetch error in fetchAllParts:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch parts that share a specific part number
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchPartsByPartNumber(partNumber: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/parts/${encodeURIComponent(partNumber)}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch { /* non-JSON */ }
      return { success: false, error: errorMessage };
    }

    const data = await response.json();           // { status: 'success', parts: [...] }
    return { success: true, data: data.parts };
  } catch (error) {
    console.error("[API] Fetch error in fetchPartsByNumber:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}