import { component$, useSignal, useTask$, type QRL } from "@builder.io/qwik";

export interface Layer {
  id: string;
  label: string;
  url: string;
  screenshotUrl: string | null;
  opacity: number;
  offsetY: number;
  offsetX: number;
  invert: boolean;
}

export type ViewMode = "overlap" | "side-by-side";

const DEFAULT_OPACITY = 0.48;

interface ControlsPanelProps {
  layers: Layer[];
  viewMode: ViewMode;
  onLayerOpacityChange: QRL<(layerId: string, value: number) => void>;
  onLayerOffsetYChange: QRL<(layerId: string, value: number) => void>;
  onLayerOffsetXChange: QRL<(layerId: string, value: number) => void>;
  onLayerInvertChange: QRL<(layerId: string, value: boolean) => void>;
  onViewModeChange: QRL<(mode: ViewMode) => void>;
}

export const ControlsPanel = component$<ControlsPanelProps>(
  ({
    layers,
    viewMode,
    onLayerOpacityChange,
    onLayerOffsetYChange,
    onLayerOffsetXChange,
    onLayerInvertChange,
    onViewModeChange,
  }) => {
    const isSideBySide = viewMode === "side-by-side";

    // Get the top layer (last in array)
    const topLayer = layers[layers.length - 1];

    const localOpacity = useSignal(topLayer?.opacity ?? DEFAULT_OPACITY);
    const localOffsetX = useSignal(topLayer?.offsetX ?? 0);
    const localOffsetY = useSignal(topLayer?.offsetY ?? 0);

    // Sync props to local signals when they change
    useTask$(({ track }) => {
      track(() => topLayer?.opacity);
      if (topLayer) localOpacity.value = topLayer.opacity;
    });

    useTask$(({ track }) => {
      track(() => topLayer?.offsetX);
      if (topLayer) localOffsetX.value = topLayer.offsetX;
    });

    useTask$(({ track }) => {
      track(() => topLayer?.offsetY);
      if (topLayer) localOffsetY.value = topLayer.offsetY;
    });

    return (
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">Controls</h2>

        {/* View Mode Toggle */}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            View Mode
          </label>
          <div class="flex gap-2">
            <button
              onClick$={() => onViewModeChange("overlap")}
              class={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                viewMode === "overlap"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Overlap
            </button>
            <button
              onClick$={() => onViewModeChange("side-by-side")}
              class={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                viewMode === "side-by-side"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Side by Side
            </button>
          </div>
        </div>

        {!isSideBySide && topLayer && (
          <div class="space-y-4">
            {/* Opacity Slider */}
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-sm font-medium text-gray-700">
                  Opacity: {Math.round(localOpacity.value * 100)}%
                </label>
                <button
                  onClick$={() => {
                    localOpacity.value = DEFAULT_OPACITY;
                    onLayerOpacityChange(topLayer.id, DEFAULT_OPACITY);
                  }}
                  class="text-xs text-blue-600 hover:text-blue-800"
                >
                  Reset
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localOpacity.value}
                onInput$={(e) => {
                  const value = parseFloat((e.target as HTMLInputElement).value);
                  localOpacity.value = value;
                  onLayerOpacityChange(topLayer.id, value);
                }}
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* X Offset Slider */}
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-sm font-medium text-gray-700">
                  X Offset: {localOffsetX.value.toFixed(1)}px
                </label>
                <button
                  onClick$={() => {
                    localOffsetX.value = 0;
                    onLayerOffsetXChange(topLayer.id, 0);
                  }}
                  class="text-xs text-blue-600 hover:text-blue-800"
                >
                  Reset
                </button>
              </div>
              <input
                type="range"
                min="-150"
                max="150"
                step="0.1"
                value={localOffsetX.value}
                onInput$={(e) => {
                  const value = parseFloat((e.target as HTMLInputElement).value);
                  localOffsetX.value = value;
                  onLayerOffsetXChange(topLayer.id, value);
                }}
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Y Offset Slider */}
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-sm font-medium text-gray-700">
                  Y Offset: {localOffsetY.value.toFixed(1)}px
                </label>
                <button
                  onClick$={() => {
                    localOffsetY.value = 0;
                    onLayerOffsetYChange(topLayer.id, 0);
                  }}
                  class="text-xs text-blue-600 hover:text-blue-800"
                >
                  Reset
                </button>
              </div>
              <input
                type="range"
                min="-150"
                max="150"
                step="0.1"
                value={localOffsetY.value}
                onInput$={(e) => {
                  const value = parseFloat((e.target as HTMLInputElement).value);
                  localOffsetY.value = value;
                  onLayerOffsetYChange(topLayer.id, value);
                }}
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Invert Checkbox */}
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                id="invert-top-layer"
                checked={topLayer.invert}
                onChange$={(e) => {
                  onLayerInvertChange(topLayer.id, (e.target as HTMLInputElement).checked);
                }}
                class="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label
                for="invert-top-layer"
                class="text-sm font-medium text-gray-700"
              >
                Invert
              </label>
            </div>
          </div>
        )}

        {isSideBySide && (
          <div class="text-sm text-gray-500 italic">
            Overlay controls are only available in overlap mode
          </div>
        )}
      </div>
    );
  },
);
