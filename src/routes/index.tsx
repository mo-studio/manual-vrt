import { component$, useSignal, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ConfigurationPanel } from "~/components/vrt/configuration-panel";
import { ControlsPanel, type Layer } from "~/components/vrt/controls-panel";
import { ComparisonViewer } from "~/components/vrt/comparison-viewer";

export default component$(() => {
  // Configuration state
  const urlA = useSignal("");
  const urlB = useSignal("");
  const viewportWidth = useSignal(900);
  const isLoading = useSignal(false);

  // Layer state (array order = z-index: first = bottom, last = top)
  const layers = useSignal<Layer[]>([
    {
      id: "layer-a",
      label: "Layer A",
      url: "",
      screenshotUrl: null,
      opacity: 1,
      offset: 0,
    },
    {
      id: "layer-b",
      label: "Layer B",
      url: "",
      screenshotUrl: null,
      opacity: 0.5,
      offset: 0,
    },
  ]);

  const error = useSignal<string | null>(null);

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
      const fullUrlA = urlA.value.trim();
      const fullUrlB = urlB.value.trim();

      // Capture both screenshots in parallel
      const [screenshotUrlA, screenshotUrlB] = await Promise.all([
        captureScreenshot(fullUrlA),
        captureScreenshot(fullUrlB),
      ]);

      // Update layers with new screenshots and URLs
      layers.value = [
        {
          ...layers.value[0],
          url: fullUrlA,
          screenshotUrl: screenshotUrlA,
        },
        {
          ...layers.value[1],
          url: fullUrlB,
          screenshotUrl: screenshotUrlB,
        },
      ];
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
              urlA={urlA.value}
              urlB={urlB.value}
              viewportWidth={viewportWidth.value}
              isLoading={isLoading.value}
              onUrlAChange={$((value: string) => {
                urlA.value = value;
              })}
              onUrlBChange={$((value: string) => {
                urlB.value = value;
              })}
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
