import { component$, type QRL } from "@builder.io/qwik";

interface ControlsPanelProps {
  opacity: number;
  topLayer: "A" | "B";
  offsetA: number;
  offsetB: number;
  onOpacityChange: QRL<(value: number) => void>;
  onTopLayerChange: QRL<(value: "A" | "B") => void>;
  onOffsetAChange: QRL<(value: number) => void>;
  onOffsetBChange: QRL<(value: number) => void>;
  onResetOffsets: QRL<() => void>;
}

export const ControlsPanel = component$<ControlsPanelProps>(
  ({
    opacity,
    topLayer,
    offsetA,
    offsetB,
    onOpacityChange,
    onTopLayerChange,
    onOffsetAChange,
    onOffsetBChange,
    onResetOffsets,
  }) => {
    return (
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">Controls</h2>

        <div class="space-y-6">
          {/* Opacity Slider */}
          <div>
            <label for="opacity" class="block text-sm font-medium mb-2">
              Opacity: {Math.round(opacity * 100)}%
            </label>
            <input
              id="opacity"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={opacity}
              onInput$={(e) =>
                onOpacityChange(parseFloat((e.target as HTMLInputElement).value))
              }
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Top Layer Selector */}
          <div>
            <label class="block text-sm font-medium mb-2">Top Layer</label>
            <div class="flex gap-2">
              <button
                onClick$={() => onTopLayerChange("A")}
                class={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  topLayer === "A"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                A (prod)
              </button>
              <button
                onClick$={() => onTopLayerChange("B")}
                class={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  topLayer === "B"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                B (dev)
              </button>
            </div>
          </div>

          {/* Vertical Offsets */}
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-medium">Vertical Offsets</label>
              <button
                onClick$={onResetOffsets}
                class="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Reset
              </button>
            </div>

            {/* Offset A */}
            <div class="mb-4">
              <label for="offsetA" class="block text-xs text-gray-600 mb-1">
                Offset A: {offsetA}px
              </label>
              <input
                id="offsetA"
                type="range"
                min="-1000"
                max="1000"
                step="1"
                value={offsetA}
                onInput$={(e) =>
                  onOffsetAChange(parseInt((e.target as HTMLInputElement).value))
                }
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Offset B */}
            <div>
              <label for="offsetB" class="block text-xs text-gray-600 mb-1">
                Offset B: {offsetB}px
              </label>
              <input
                id="offsetB"
                type="range"
                min="-1000"
                max="1000"
                step="1"
                value={offsetB}
                onInput$={(e) =>
                  onOffsetBChange(parseInt((e.target as HTMLInputElement).value))
                }
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);
