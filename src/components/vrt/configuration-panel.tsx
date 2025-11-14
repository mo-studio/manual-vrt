import { component$, type QRL } from "@builder.io/qwik";
import type { Layer } from "./controls-panel";

interface ConfigurationPanelProps {
  layers: Layer[];
  viewportWidth: number;
  isLoading: boolean;
  onUrlChange: QRL<(id: string, url: string) => void>;
  onLabelChange: QRL<(id: string, label: string) => void>;
  onAddLayer: QRL<() => void>;
  onRemoveLayer: QRL<(id: string) => void>;
  onViewportWidthChange: QRL<(value: number) => void>;
  onCompare: QRL<() => void>;
}

export const ConfigurationPanel = component$<ConfigurationPanelProps>(
  ({
    layers,
    viewportWidth,
    isLoading,
    onUrlChange,
    onLabelChange,
    onAddLayer,
    onRemoveLayer,
    onViewportWidthChange,
    onCompare,
  }) => {
    const hasAnyUrl = layers.some((layer) => layer.url.trim());
    const isDisabled = isLoading || !hasAnyUrl;
    const canRemove = layers.length > 2;
    return (
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">Configuration</h2>

        <div class="space-y-4">
          {/* Layer inputs */}
          {layers.map((layer, index) => (
            <div key={layer.id} class="border border-gray-200 rounded-md p-3">
              <div class="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={layer.label}
                  onInput$={(e) =>
                    onLabelChange(layer.id, (e.target as HTMLInputElement).value)
                  }
                  placeholder={`Layer ${index + 1}`}
                  class="text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0 px-0"
                  disabled={isLoading}
                />
                {canRemove && (
                  <button
                    onClick$={() => onRemoveLayer(layer.id)}
                    disabled={isLoading}
                    class="text-red-600 hover:text-red-800 text-sm"
                    title="Remove layer"
                  >
                    ✕
                  </button>
                )}
              </div>
              <input
                type="text"
                value={layer.url}
                onInput$={(e) =>
                  onUrlChange(layer.id, (e.target as HTMLInputElement).value)
                }
                placeholder="https://www.example.com/about"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
          ))}

          {/* Add Layer button */}
          <button
            onClick$={onAddLayer}
            disabled={isLoading}
            class="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add Layer
          </button>

          {/* Advanced Options */}
          <details class="mt-4">
            <summary class="cursor-pointer text-sm font-medium text-gray-700">
              Advanced Options
            </summary>
            <div class="mt-4 space-y-4">
              {/* Viewport Width */}
              <div>
                <label
                  for="viewportWidth"
                  class="block text-sm font-medium mb-1"
                >
                  Viewport Width (px)
                </label>
                <input
                  id="viewportWidth"
                  type="number"
                  value={viewportWidth}
                  onInput$={(e) =>
                    onViewportWidthChange(
                      parseInt((e.target as HTMLInputElement).value) || 900,
                    )
                  }
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>
          </details>

          {/* Compare Button */}
          <button
            onClick$={onCompare}
            disabled={isDisabled}
            class={`w-full py-3 px-4 rounded-md font-medium text-white ${
              isDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } transition-colors`}
          >
            {isLoading ? "Capturing screenshots..." : "Compare"}
          </button>
        </div>
      </div>
    );
  },
);
