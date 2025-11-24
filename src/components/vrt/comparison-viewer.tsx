import { component$, useSignal, $, type QRL } from "@builder.io/qwik";
import type { Layer, ViewMode } from "./controls-panel";

// Color palette for layer labels in overlap mode
const LAYER_COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // green
  "#F59E0B", // amber
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
];

interface ComparisonViewerProps {
  layers: Layer[]; // Array order = z-index (first = bottom, last = top)
  viewMode: ViewMode;
  error: string | null;
  onAutoAlign?: QRL<(offsetX: number, offsetY: number) => void>;
  animateOffset?: boolean;
}

// Template radius (19px diameter = 9px radius)
const TEMPLATE_RADIUS = 9;

// Search radius for finding match in bottom image
const SEARCH_RADIUS = 150;

// Minimum confidence threshold (70%)
const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Extract pixel data from an image at a specific region
 */
async function extractImageRegion(
  imgSrc: string,
  centerX: number,
  centerY: number,
  radius: number,
): Promise<{ data: Uint8ClampedArray; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = radius * 2 + 1;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      // Draw the region from the image
      ctx.drawImage(
        img,
        centerX - radius,
        centerY - radius,
        size,
        size,
        0,
        0,
        size,
        size,
      );

      const imageData = ctx.getImageData(0, 0, size, size);
      resolve({ data: imageData.data, width: size, height: size });
    };
    img.onerror = () => resolve(null);
    img.src = imgSrc;
  });
}

/**
 * Normalized Cross-Correlation (NCC) between two image patches
 * Returns a value between -1 and 1, where 1 is a perfect match
 */
function calculateNCC(
  template: Uint8ClampedArray,
  patch: Uint8ClampedArray,
): number {
  if (template.length !== patch.length) return -1;

  const n = template.length / 4; // Number of pixels (RGBA = 4 channels)

  // Calculate means (using grayscale for simplicity)
  let templateMean = 0;
  let patchMean = 0;

  for (let i = 0; i < n; i++) {
    const tGray =
      0.299 * template[i * 4] +
      0.587 * template[i * 4 + 1] +
      0.114 * template[i * 4 + 2];
    const pGray =
      0.299 * patch[i * 4] +
      0.587 * patch[i * 4 + 1] +
      0.114 * patch[i * 4 + 2];
    templateMean += tGray;
    patchMean += pGray;
  }

  templateMean /= n;
  patchMean /= n;

  // Calculate NCC
  let numerator = 0;
  let templateVar = 0;
  let patchVar = 0;

  for (let i = 0; i < n; i++) {
    const tGray =
      0.299 * template[i * 4] +
      0.587 * template[i * 4 + 1] +
      0.114 * template[i * 4 + 2];
    const pGray =
      0.299 * patch[i * 4] +
      0.587 * patch[i * 4 + 1] +
      0.114 * patch[i * 4 + 2];

    const tDiff = tGray - templateMean;
    const pDiff = pGray - patchMean;

    numerator += tDiff * pDiff;
    templateVar += tDiff * tDiff;
    patchVar += pDiff * pDiff;
  }

  const denominator = Math.sqrt(templateVar * patchVar);
  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Find the best matching position in the top image for a point clicked on the bottom image.
 * Returns the offset needed to align the top image so its matching point overlays the click point.
 */
async function findBestMatch(
  bottomImgSrc: string,
  topImgSrc: string,
  clickX: number,
  clickY: number,
): Promise<{ offsetX: number; offsetY: number; confidence: number } | null> {
  // Round click coordinates for pixel-level template extraction
  // We'll work with integer pixels for the search, then the offset will also be integer
  const roundedClickX = Math.round(clickX);
  const roundedClickY = Math.round(clickY);

  // Extract template from bottom image at the click position
  // The click coordinates are relative to the bottom (stable) image
  const template = await extractImageRegion(
    bottomImgSrc,
    roundedClickX,
    roundedClickY,
    TEMPLATE_RADIUS,
  );

  if (!template) return null;

  // Load top image to search within
  const topImg = new Image();
  topImg.crossOrigin = "anonymous";

  return new Promise((resolve) => {
    topImg.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = topImg.width;
      canvas.height = topImg.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(topImg, 0, 0);

      let bestMatch = { offsetX: 0, offsetY: 0, confidence: -1 };
      const templateSize = TEMPLATE_RADIUS * 2 + 1;

      // Search around the corresponding position in the top image
      // We search within SEARCH_RADIUS pixels of where we'd expect the match
      // Use rounded coordinates for consistent integer pixel operations
      const searchCenterX = roundedClickX;
      const searchCenterY = roundedClickY;

      for (let dy = -SEARCH_RADIUS; dy <= SEARCH_RADIUS; dy++) {
        for (let dx = -SEARCH_RADIUS; dx <= SEARCH_RADIUS; dx++) {
          const testX = searchCenterX + dx;
          const testY = searchCenterY + dy;

          // Skip if out of bounds
          if (
            testX - TEMPLATE_RADIUS < 0 ||
            testY - TEMPLATE_RADIUS < 0 ||
            testX + TEMPLATE_RADIUS >= topImg.width ||
            testY + TEMPLATE_RADIUS >= topImg.height
          ) {
            continue;
          }

          // Extract patch from top image
          const patchData = ctx.getImageData(
            testX - TEMPLATE_RADIUS,
            testY - TEMPLATE_RADIUS,
            templateSize,
            templateSize,
          );

          const ncc = calculateNCC(template.data, patchData.data);

          if (ncc > bestMatch.confidence) {
            // The offset needed: if the best match in top image is at (testX, testY),
            // and we clicked at (roundedClickX, roundedClickY) on the bottom image,
            // the top image needs to move by (roundedClickX - testX, roundedClickY - testY)
            // so that its matching point aligns with the click point
            bestMatch = {
              offsetX: roundedClickX - testX,
              offsetY: roundedClickY - testY,
              confidence: ncc,
            };
          }
        }
      }

      resolve(bestMatch.confidence > -1 ? bestMatch : null);
    };
    topImg.onerror = () => resolve(null);
    topImg.src = topImgSrc;
  });
}

export const ComparisonViewer = component$<ComparisonViewerProps>(
  ({ layers, viewMode, error, onAutoAlign, animateOffset }) => {
    const toastMessage = useSignal<string | null>(null);
    const toastType = useSignal<"error" | "success">("error");
    const isAligning = useSignal(false);

    const showToast = $((message: string, type: "error" | "success") => {
      toastMessage.value = message;
      toastType.value = type;
      setTimeout(() => {
        toastMessage.value = null;
      }, 3000);
    });

    const handleOverlapClick = $(
      async (e: MouseEvent, container: HTMLElement) => {
        if (!onAutoAlign || isAligning.value) return;

        // In Qwik, currentTarget is passed as the second argument (not e.currentTarget)
        const rect = container.getBoundingClientRect();

        // Get click position relative to the container (in displayed/CSS pixels)
        const displayClickX = e.clientX - rect.left + container.scrollLeft;
        const displayClickY = e.clientY - rect.top + container.scrollTop;

        // Get bottom and top layers
        const bottomLayer = layers.find((l) => l.screenshotUrl);
        const topLayer = [...layers]
          .reverse()
          .find((l) => l.screenshotUrl && l !== bottomLayer);

        if (!bottomLayer?.screenshotUrl || !topLayer?.screenshotUrl) {
          showToast("Need at least two images for auto-align", "error");
          return;
        }

        isAligning.value = true;

        try {
          // Calculate scale factor: the images are displayed at container width
          // but have their natural dimensions
          const img = container.querySelector("img") as HTMLImageElement | null;
          if (!img) {
            showToast("Could not find image element", "error");
            return;
          }

          // Get the displayed width vs natural width to calculate scale
          const displayedWidth = img.clientWidth;
          const naturalWidth = img.naturalWidth;
          const scale = naturalWidth / displayedWidth;

          // Convert displayed click coordinates to natural image coordinates
          const clickX = displayClickX * scale;
          const clickY = displayClickY * scale;

          const result = await findBestMatch(
            bottomLayer.screenshotUrl,
            topLayer.screenshotUrl,
            clickX,
            clickY,
          );

          if (!result) {
            showToast("Could not analyze the selected region", "error");
            return;
          }

          if (result.confidence < CONFIDENCE_THRESHOLD) {
            showToast(
              `Match confidence too low (${Math.round(result.confidence * 100)}%). Try clicking on a more distinctive area.`,
              "error",
            );
            return;
          }

          // Success - apply the alignment
          // Scale the offset back from natural image space to display space
          // Keep decimal precision for sub-pixel alignment
          const displayOffsetX = result.offsetX / scale;
          const displayOffsetY = result.offsetY / scale;

          showToast(
            `Aligned with ${Math.round(result.confidence * 100)}% confidence`,
            "success",
          );
          onAutoAlign(displayOffsetX, displayOffsetY);
        } catch (err) {
          showToast("Error during auto-align", "error");
          console.error("Auto-align error:", err);
        } finally {
          isAligning.value = false;
        }
      },
    );

    if (error) {
      return (
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-bold mb-4">Comparison Viewer</h2>
          <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <p class="text-red-800 font-medium">Error</p>
            <p class="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      );
    }

    const hasScreenshots = layers.some((layer) => layer.screenshotUrl);

    if (!hasScreenshots) {
      return (
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-bold mb-4">Comparison Viewer</h2>
          <div class="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
            <p class="text-gray-600">
              Enter URLs and click Compare to see the comparison
            </p>
          </div>
        </div>
      );
    }

    const layersWithScreenshots = layers.filter((l) => l.screenshotUrl);

    if (viewMode === "side-by-side") {
      return (
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-bold mb-4">Comparison Viewer</h2>

          {/* URL Labels - outside scrollable container */}
          <div class="flex gap-4 mb-2">
            {layersWithScreenshots.map((layer) => (
              <div
                key={layer.id}
                class="flex-1 min-w-0 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 truncate font-mono"
              >
                {layer.url}
              </div>
            ))}
          </div>

          <div
            class="border border-gray-300 rounded-md overflow-auto"
            style={{ height: "80vh", maxWidth: "100%" }}
          >
            <div class="flex gap-4">
              {layersWithScreenshots.map((layer) => (
                <div key={layer.id} class="flex-1 min-w-0">
                  <img
                    src={layer.screenshotUrl!}
                    alt={`${layer.label} screenshot`}
                    class="w-full h-auto block"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div class="mt-4 flex gap-4 text-sm flex-wrap">
            {layersWithScreenshots.map((layer) => (
              <div key={layer.id} class="flex items-center gap-2">
                <div class="w-4 h-4 bg-blue-600 rounded"></div>
                <span class="text-gray-700">{layer.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Overlap mode
    return (
      <div class="bg-white rounded-lg shadow-md p-6 relative">
        <h2 class="text-2xl font-bold mb-4">Comparison Viewer</h2>

        {/* Toast notification */}
        {toastMessage.value && (
          <div
            class={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-opacity duration-300 ${
              toastType.value === "error"
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            {toastMessage.value}
          </div>
        )}

        {/* URL Labels with color coding */}
        <div class="mb-4 space-y-1">
          {layersWithScreenshots.map((layer, index) => (
            <div
              key={layer.id}
              class="px-2 py-1 rounded text-xs font-mono truncate"
              style={{
                backgroundColor: `${LAYER_COLORS[index % LAYER_COLORS.length]}20`,
                color: LAYER_COLORS[index % LAYER_COLORS.length],
                borderLeft: `3px solid ${LAYER_COLORS[index % LAYER_COLORS.length]}`,
              }}
            >
              {layer.label}: {layer.url}
            </div>
          ))}
        </div>

        {/* Auto-align hint */}
        {onAutoAlign && (
          <div class="mb-2 text-xs text-gray-500 italic">
            Click a point on the image to auto-align the X/Y offset
          </div>
        )}

        <div
          class="relative border border-gray-300 rounded-md overflow-auto"
          style={{
            height: "80vh",
            cursor: onAutoAlign
              ? isAligning.value
                ? "wait"
                : "crosshair"
              : "default",
          }}
          onClick$={handleOverlapClick}
        >
          {/* Render layers in array order (first = bottom) */}
          {layers.map((layer, index) => {
            if (!layer.screenshotUrl) return null;

            const isBottomLayer = index === 0;

            return (
              <div
                key={layer.id}
                class="absolute inset-0"
                style={{
                  opacity: isBottomLayer ? 1 : layer.opacity,
                  zIndex: index,
                }}
              >
                <img
                  src={layer.screenshotUrl}
                  alt={`${layer.label} screenshot`}
                  class="w-full h-auto block"
                  style={
                    isBottomLayer
                      ? {}
                      : {
                          transform: `translate(${layer.offsetX}px, ${layer.offsetY}px)`,
                          filter: layer.invert ? "invert(1)" : "none",
                          transition: animateOffset
                            ? "transform 300ms ease-out"
                            : "none",
                        }
                  }
                />
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div class="mt-4 flex gap-4 text-sm flex-wrap">
          {layersWithScreenshots.map((layer, index) => (
            <div key={layer.id} class="flex items-center gap-2">
              <div
                class="w-4 h-4 rounded"
                style={{
                  backgroundColor: LAYER_COLORS[index % LAYER_COLORS.length],
                  opacity: index === 0 ? 1 : layer.opacity,
                }}
              ></div>
              <span class="text-gray-700">{layer.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
);
