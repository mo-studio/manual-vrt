import { component$ } from "@builder.io/qwik";

interface ComparisonViewerProps {
  screenshotA: string | null;
  screenshotB: string | null;
  opacity: number;
  topLayer: "A" | "B";
  offsetA: number;
  offsetB: number;
  error: string | null;
}

export const ComparisonViewer = component$<ComparisonViewerProps>(
  ({ screenshotA, screenshotB, opacity, topLayer, offsetA, offsetB, error }) => {
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

    if (!screenshotA || !screenshotB) {
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

    const bottomImage = topLayer === "A" ? screenshotB : screenshotA;
    const topImage = topLayer === "A" ? screenshotA : screenshotB;
    const bottomOffset = topLayer === "A" ? offsetB : offsetA;
    const topOffset = topLayer === "A" ? offsetA : offsetB;

    return (
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold mb-4">Comparison Viewer</h2>
        
        <div
          class="relative border border-gray-300 rounded-md overflow-auto"
          style={{ height: "80vh" }}
        >
          {/* Bottom layer */}
          <div class="absolute inset-0">
            <img
              src={bottomImage}
              alt="Bottom layer"
              class="w-full h-auto block"
              style={{
                transform: `translateY(${bottomOffset}px)`,
              }}
            />
          </div>

          {/* Top layer with opacity */}
          <div
            class="absolute inset-0"
            style={{
              opacity: opacity,
            }}
          >
            <img
              src={topImage}
              alt="Top layer"
              class="w-full h-auto block"
              style={{
                transform: `translateY(${topOffset}px)`,
              }}
            />
          </div>
        </div>

        {/* Legend */}
        <div class="mt-4 flex gap-4 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-blue-600 rounded"></div>
            <span>A (prod)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-green-600 rounded"></div>
            <span>B (dev)</span>
          </div>
          <div class="flex items-center gap-2 ml-auto">
            <span class="text-gray-600">
              Top layer: {topLayer} ({topLayer === "A" ? "prod" : "dev"})
            </span>
          </div>
        </div>
      </div>
    );
  }
);
