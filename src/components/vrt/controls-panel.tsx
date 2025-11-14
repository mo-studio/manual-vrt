import { component$, $, type QRL } from "@builder.io/qwik";
import { LayerControl } from "./layer-control";

export interface Layer {
  id: string;
  label: string;
  url: string;
  screenshotUrl: string | null;
  opacity: number;
  offset: number;
}

interface ControlsPanelProps {
  layers: Layer[]; // Array order = z-index (first = bottom, last = top)
  onLayerOpacityChange: QRL<(layerId: string, value: number) => void>;
  onLayerOffsetChange: QRL<(layerId: string, value: number) => void>;
  onMoveLayerUp: QRL<(layerId: string) => void>;
  onMoveLayerDown: QRL<(layerId: string) => void>;
}

export const ControlsPanel = component$<ControlsPanelProps>(
  ({
    layers,
    onLayerOpacityChange,
    onLayerOffsetChange,
    onMoveLayerUp,
    onMoveLayerDown,
  }) => {
    // Display layers in reverse order (top layer first)
    const displayLayers = [...layers].reverse();

    return (
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">Layer Controls</h2>

        <div class="space-y-4">
          {displayLayers.map((layer, displayIndex) => {
            const actualIndex = layers.length - 1 - displayIndex;
            const isTopLayer = actualIndex === layers.length - 1;
            const isBottomLayer = actualIndex === 0;

            return (
              <LayerControl
                key={layer.id}
                label={layer.label}
                url={layer.url}
                opacity={layer.opacity}
                offset={layer.offset}
                zIndex={actualIndex + 1} // Display as 1-indexed for UX
                onOpacityChange={$((value: number) =>
                  onLayerOpacityChange(layer.id, value)
                )}
                onOffsetChange={$((value: number) =>
                  onLayerOffsetChange(layer.id, value)
                )}
                onMoveUp={$(() => onMoveLayerUp(layer.id))}
                onMoveDown={$(() => onMoveLayerDown(layer.id))}
                canMoveUp={!isTopLayer}
                canMoveDown={!isBottomLayer}
              />
            );
          })}
        </div>
      </div>
    );
  }
);
