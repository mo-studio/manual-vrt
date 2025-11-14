import { component$, useSignal, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ConfigurationPanel } from "~/components/vrt/configuration-panel";
import { ControlsPanel, type Layer } from "~/components/vrt/controls-panel";
import { ComparisonViewer } from "~/components/vrt/comparison-viewer";

export default component$(() => {
  // Configuration state
  const viewportWidth = useSignal(900);
  const isLoading = useSignal(false);

  // Layer state (array order = z-index: first = bottom, last = top)
  const layers = useSignal<Layer[]>([
    {
      id: "layer-1",
      label: "Layer 1",
      url: "",
      screenshotUrl: null,
      opacity: 1,
      offset: 0,
    },
    {
      id: "layer-2",
      label: "Layer 2",
      url: "",
      screenshotUrl: null,
      opacity: 0.5,
      offset: 0,
    },
  ]);

  const error = useSignal<string | null>(null);

  const handleAddLayer = $(() => {
    const newId = `layer-${Date.now()}`;
    layers.value = [
      ...layers.value,
      {
        id: newId,
        label: `Layer ${layers.value.length + 1}`,
        url: "",
        screenshotUrl: null,
        opacity: 0.5,
        offset: 0,
      },
    ];
  });

  const handleRemoveLayer = $((id: string) => {
    if (layers.value.length > 2) {
      layers.value = layers.value.filter((layer) => layer.id !== id);
    }
  });

  const handleUrlChange = $((id: string, url: string) => {
    layers.value = layers.value.map((layer) =>
      layer.id === id ? { ...layer, url } : layer,
    );
  });

  const handleLabelChange = $((id: string, label: string) => {
    layers.value = layers.value.map((layer) =>
      layer.id === id ? { ...layer, label } : layer,
    );
  });

  const captureScreenshot = $(async (url: string) => {
    const response = await fetch("/api/compare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        viewportWidth: viewportWidth.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to capture screenshot");
    }

    return data.screenshotUrl;
  });

  const handleCompare = $(async () => {
    isLoading.value = true;
    error.value = null;

    try {
      // Filter out layers without URLs
      const layersWithUrls = layers.value.filter((layer) => layer.url.trim());

      if (layersWithUrls.length === 0) {
        throw new Error("Please provide at least one URL");
      }

      // Capture all screenshots in parallel
      const screenshotResults = await Promise.all(
        layersWithUrls.map(async (layer) => ({
          ...layer,
          screenshotUrl: await captureScreenshot(layer.url.trim()),
        })),
      );

      // Update layers with new screenshots
      layers.value = layers.value.map((layer) => {
        const result = screenshotResults.find((r) => r.id === layer.id);
        return result || layer;
      });
    } catch (err) {
      error.value = err instanceof Error ? err.message : "An error occurred";
    } finally {
      isLoading.value = false;
    }
  });

  const handleLayerOpacityChange = $((layerId: string, value: number) => {
    layers.value = layers.value.map((layer) =>
      layer.id === layerId ? { ...layer, opacity: value } : layer,
    );
  });

  const handleLayerOffsetChange = $((layerId: string, value: number) => {
    layers.value = layers.value.map((layer) =>
      layer.id === layerId ? { ...layer, offset: value } : layer,
    );
  });

  const handleMoveLayerUp = $((layerId: string) => {
    const currentIndex = layers.value.findIndex((l) => l.id === layerId);
    if (currentIndex < layers.value.length - 1) {
      const newLayers = [...layers.value];
      [newLayers[currentIndex], newLayers[currentIndex + 1]] = [
        newLayers[currentIndex + 1],
        newLayers[currentIndex],
      ];
      layers.value = newLayers;
    }
  });

  const handleMoveLayerDown = $((layerId: string) => {
    const currentIndex = layers.value.findIndex((l) => l.id === layerId);
    if (currentIndex > 0) {
      const newLayers = [...layers.value];
      [newLayers[currentIndex], newLayers[currentIndex - 1]] = [
        newLayers[currentIndex - 1],
        newLayers[currentIndex],
      ];
      layers.value = newLayers;
    }
  });

  return (
    <div class="min-h-screen bg-gray-100">
      <div class="container mx-auto px-4 py-8">
        <header class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">
            Manual Visual Regression Tool
          </h1>
          <p class="text-gray-600">
            Compare two versions of the same page from different environments
          </p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Configuration and Controls */}
          <div class="lg:col-span-1 space-y-6">
            <ConfigurationPanel
              layers={layers.value}
              viewportWidth={viewportWidth.value}
              isLoading={isLoading.value}
              onUrlChange={handleUrlChange}
              onLabelChange={handleLabelChange}
              onAddLayer={handleAddLayer}
              onRemoveLayer={handleRemoveLayer}
              onViewportWidthChange={$((value: number) => {
                viewportWidth.value = value;
              })}
              onCompare={handleCompare}
            />

            {layers.value.some((l) => l.screenshotUrl) && (
              <ControlsPanel
                layers={layers.value}
                onLayerOpacityChange={handleLayerOpacityChange}
                onLayerOffsetChange={handleLayerOffsetChange}
                onMoveLayerUp={handleMoveLayerUp}
                onMoveLayerDown={handleMoveLayerDown}
              />
            )}
          </div>

          {/* Right column: Comparison Viewer */}
          <div class="lg:col-span-2">
            <ComparisonViewer layers={layers.value} error={error.value} />
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Manual Visual Regression Tool",
  meta: [
    {
      name: "description",
      content:
        "Compare two versions of the same page from different environments",
    },
  ],
};
