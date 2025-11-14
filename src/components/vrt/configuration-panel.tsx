import { component$, type QRL } from "@builder.io/qwik";

interface ConfigurationPanelProps {
  urlA: string;
  urlB: string;
  viewportWidth: number;
  isLoading: boolean;
  onUrlAChange: QRL<(value: string) => void>;
  onUrlBChange: QRL<(value: string) => void>;
  onViewportWidthChange: QRL<(value: number) => void>;
  onCompare: QRL<() => void>;
}

export const ConfigurationPanel = component$<ConfigurationPanelProps>(
  ({
    urlA,
    urlB,
    viewportWidth,
    isLoading,
    onUrlAChange,
    onUrlBChange,
    onViewportWidthChange,
    onCompare,
  }) => {
    const isDisabled = isLoading || !urlA.trim() || !urlB.trim();

    return (
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">Configuration</h2>

        <div class="space-y-4">
          {/* URL A */}
          <div>
            <label for="urlA" class="block text-sm font-medium mb-1">
              URL A
            </label>
            <input
              id="urlA"
              type="text"
              value={urlA}
              onInput$={(e) =>
                onUrlAChange((e.target as HTMLInputElement).value)
              }
              placeholder="https://www.example.com/about"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* URL B */}
          <div>
            <label for="urlB" class="block text-sm font-medium mb-1">
              URL B
            </label>
            <input
              id="urlB"
              type="text"
              value={urlB}
              onInput$={(e) =>
                onUrlBChange((e.target as HTMLInputElement).value)
              }
              placeholder="https://dev.example.com/about"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

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
