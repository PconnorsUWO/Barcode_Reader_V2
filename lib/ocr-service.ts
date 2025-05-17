import * as Tesseract from "tesseract.js";

// Define the fixed bounding boxes for OCR
export const OCR_BOUNDING_BOXES = [
  { id: "box1", x: 200, y: 200, width: 100, height: 40 },
  { id: "box2", x: 180, y: 40, width: 50, height: 50 },
];

export interface OcrResults {
  box1Text: string;
  box2Text: string;
}

// Add this new interface
export interface OcrInputDimensions {
  videoStreamWidth: number;
  videoStreamHeight: number;
  videoDisplayWidth: number;
  videoDisplayHeight: number;
}

/**
 * Processes a single region of a larger canvas for OCR.
 * @param fullFrameCanvas The canvas containing the full image.
 * @param sourceX The x-coordinate of the top-left corner of the region in the fullFrameCanvas.
 * @param sourceY The y-coordinate of the top-left corner of the region in the fullFrameCanvas.
 * @param sourceWidth The width of the region in the fullFrameCanvas.
 * @param sourceHeight The height of the region in the fullFrameCanvas.
 * @param regionId A unique identifier for the region (for logging).
 * @returns A promise that resolves to the recognized text.
 */
async function processSingleRegion(
  fullFrameCanvas: HTMLCanvasElement,
  sourceX: number,
  sourceY: number,
  sourceWidth: number,
  sourceHeight: number,
  regionId: string
): Promise<string> {
  const regionCanvas = document.createElement('canvas');
  regionCanvas.width = sourceWidth;
  regionCanvas.height = sourceHeight;
  const regionContext = regionCanvas.getContext('2d');

  if (!regionContext) {
    console.error(`Could not get 2D context for ${regionId} canvas`);
    return "";
  }

  // Draw the specified region from the full frame canvas to the new region canvas
  regionContext.drawImage(
    fullFrameCanvas,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    regionCanvas.width,
    regionCanvas.height
  );

  try {
    // — debug: show each crop on the page
    const dbg = document.createElement("img");
    dbg.src = regionCanvas.toDataURL();
    dbg.style.border = "2px solid lime";
    dbg.style.margin = "4px";
    document.body.append(dbg);

    // pass the canvas element directly
    const result = await Tesseract.recognize(regionCanvas, "eng", {
      // you can add lang / psm settings here:
      // tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
    });
    return result.data.text.trim();
  } catch (err) {
    console.error(`OCR error for ${regionId}:`, err);
    return "";
  }
}

/**
 * Performs OCR on predefined regions of a captured video frame.
 * @param fullFrameCanvas The HTMLCanvasElement containing the fully captured video frame
 * @param dimensions The dimensions of the video stream and its display element.
 * @returns A promise that resolves to an OcrResults object.
 */
export async function performOcrOnRegions(
  fullFrameCanvas: HTMLCanvasElement,
  dimensions: OcrInputDimensions // Changed from videoElement
): Promise<OcrResults> {
  if (!fullFrameCanvas || !dimensions) {
    console.error("Full frame canvas and dimensions are required for OCR processing.");
    return { box1Text: "Error: Missing canvas/dimensions", box2Text: "Error: Missing canvas/dimensions" };
  }

  const vw = dimensions.videoStreamWidth;
  const vh = dimensions.videoStreamHeight;
  const dw = dimensions.videoDisplayWidth;
  const dh = dimensions.videoDisplayHeight;

  if (vw === 0 || vh === 0 || dw === 0 || dh === 0) {
    console.error("Video dimensions or display dimensions are zero. Cannot perform OCR.", { vw, vh, dw, dh });
    return { box1Text: "Error: Video dimensions zero", box2Text: "Error: Video dimensions zero" };
  }

  const videoAspectRatio = vw / vh;
  const displayAspectRatio = dw / dh;

  let scaleToVideoCoords: number; // Factor to convert display coordinates to video frame coordinates
  let offsetX_videoCoords = 0;    // Offset X on the video frame (fullFrameCanvas)
  let offsetY_videoCoords = 0;    // Offset Y on the video frame (fullFrameCanvas)

  // Calculate scaling and offsets to map display bounding boxes to the fullFrameCanvas
  // This accounts for 'object-cover' behavior.
  if (videoAspectRatio > displayAspectRatio) {
    // Video is wider than display container (e.g., 16:9 video in a 4:3 display area)
    // It's scaled to fit the display height, and width is cropped.
    scaleToVideoCoords = vh / dh; // Each display pixel in Y corresponds to 'scale' video pixels. Same for X due to aspect lock.
    const videoContentWidthInVideoCoords = vw;
    const displayableContentWidthInVideoCoords = dw * scaleToVideoCoords;
    offsetX_videoCoords = (videoContentWidthInVideoCoords - displayableContentWidthInVideoCoords) / 2;
  } else {
    // Video is taller than or same aspect ratio as display container (e.g., 4:3 video in 16:9 display area)
    // It's scaled to fit the display width, and height is cropped.
    scaleToVideoCoords = vw / dw; // Each display pixel in X corresponds to 'scale' video pixels. Same for Y.
    const videoContentHeightInVideoCoords = vh;
    const displayableContentHeightInVideoCoords = dh * scaleToVideoCoords;
    offsetY_videoCoords = (videoContentHeightInVideoCoords - displayableContentHeightInVideoCoords) / 2;
  }
  
  // Ensure offsets are not negative (should not happen with object-cover logic if vw,vh,dw,dh are correct)
  offsetX_videoCoords = Math.max(0, offsetX_videoCoords);
  offsetY_videoCoords = Math.max(0, offsetY_videoCoords);

  const results: Partial<OcrResults> = {};

  for (const boxDef of OCR_BOUNDING_BOXES) {
    // Convert boxDef coordinates (relative to display) to fullFrameCanvas coordinates
    const sourceX = (boxDef.x * scaleToVideoCoords) + offsetX_videoCoords;
    const sourceY = (boxDef.y * scaleToVideoCoords) + offsetY_videoCoords;
    const sourceWidth = boxDef.width * scaleToVideoCoords;
    const sourceHeight = boxDef.height * scaleToVideoCoords;

    // console.log(`[OCR Debug] Box: ${boxDef.id}`);
    // console.log(`  Display Box (x,y,w,h): ${boxDef.x}, ${boxDef.y}, ${boxDef.width}, ${boxDef.height}`);
    // console.log(`  Video Dims (vw,vh): ${vw}, ${vh} | Display Dims (dw,dh): ${dw}, ${dh}`);
    // console.log(`  Scale: ${scaleToVideoCoords.toFixed(3)}, Offset (X,Y): ${offsetX_videoCoords.toFixed(2)}, ${offsetY_videoCoords.toFixed(2)}`);
    // console.log(`  Source Region on Canvas (x,y,w,h): ${sourceX.toFixed(2)}, ${sourceY.toFixed(2)}, ${sourceWidth.toFixed(2)}, ${sourceHeight.toFixed(2)}`);

    // Ensure extracted region is within the bounds of the fullFrameCanvas
    if (sourceX < 0 || sourceY < 0 || sourceWidth <= 0 || sourceHeight <= 0 || 
        sourceX + sourceWidth > vw || sourceY + sourceHeight > vh) {
      console.warn(`[OCR Warning] Box ${boxDef.id} is partially or fully outside the video frame after scaling. Skipping.`);
      if (boxDef.id === "box1") results.box1Text = "Region Error";
      else if (boxDef.id === "box2") results.box2Text = "Region Error";
      continue;
    }
    
    const text = await processSingleRegion(
      fullFrameCanvas,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      boxDef.id
    );
    if (boxDef.id === "box1") {
      results.box1Text = text;
    } else if (boxDef.id === "box2") {
      results.box2Text = text;
    }
  }

  return results as OcrResults;
}