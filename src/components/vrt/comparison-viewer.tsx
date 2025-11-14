import { component$ } from "@builder.io/qwik";
import type { Layer } from "./controls-panel";

interface ComparisonViewerProps {
  layers: Layer[]; // Array order = z-index (first = bottom, last = top)
  error: string | null;
}

export const ComparisonViewer = component$<ComparisonViewerProps>(
  ({ layers, error }) => {
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

    return (
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold mb-4">Comparison Viewer</h2>

        <div
          class="relative border border-gray-300 rounded-md overflow-auto"
          style={{ height: "80vh" }}
        >
          {/* Render layers in array order (first = bottom) */}
          {layers.map((layer, index) => {
            if (!layer.screenshotUrl) return null;

            return (
              <div
                key={layer.id}
                class="absolute inset-0"
                style={{
                  opacity: layer.opacity,
                  zIndex: index,
                }}
              >
                <img
                  src={layer.screenshotUrl}
                  alt={`${layer.label} screenshot`}
                  class="w-full h-auto block"
                  style={{
                    transform: `translateY(${layer.offset}px)`,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div class="mt-4 flex gap-4 text-sm flex-wrap">
          {layers.map((layer) => (
            <div key={layer.id} class="flex items-center gap-2">
              <div class="w-4 h-4 bg-blue-600 rounded"></div>
              <span class="text-gray-700">{layer.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);
