import { component$, type QRL } from "@builder.io/qwik";

interface LayerControlProps {
  label: string;
  url: string;
  opacity: number;
  offset: number;
  zIndex: number;
  onOpacityChange: QRL<(value: number) => void>;
  onOffsetChange: QRL<(value: number) => void>;
  onMoveUp: QRL<() => void>;
  onMoveDown: QRL<() => void>;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export const LayerControl = component$<LayerControlProps>(
  ({
    label,
    url,
    opacity,
    offset,
    zIndex,
    onOpacityChange,
    onOffsetChange,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
  }) => {
    return (
      <div class="border border-gray-300 rounded-lg p-4 bg-gray-50">
        <div class="flex items-center justify-between mb-3">
          <div class="flex-1">
            <div class="font-medium text-sm text-gray-900">{label}</div>
            <div class="text-xs text-gray-600 truncate">{url}</div>
          </div>
          <div class="flex flex-col gap-1 ml-4">
            <button
              onClick$={onMoveUp}
              disabled={!canMoveUp}
              class={`p-1 rounded ${
                canMoveUp
                  ? "bg-blue-100 hover:bg-blue-200 text-blue-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              title="Move layer up"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>
            <button
              onClick$={onMoveDown}
              disabled={!canMoveDown}
              class={`p-1 rounded ${
                canMoveDown
                  ? "bg-blue-100 hover:bg-blue-200 text-blue-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              title="Move layer down"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>

        <div class="space-y-3">
          {/* Opacity Slider */}
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Opacity: {Math.round(opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={opacity}
              onInput$={(e) =>
                onOpacityChange(
                  parseFloat((e.target as HTMLInputElement).value),
                )
              }
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Offset Slider */}
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Vertical Offset: {offset}px
            </label>
            <input
              type="range"
              min="-1000"
              max="1000"
              step="1"
              value={offset}
              onInput$={(e) =>
                onOffsetChange(parseInt((e.target as HTMLInputElement).value))
              }
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>
    );
  },
);
