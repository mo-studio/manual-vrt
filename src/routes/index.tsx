import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ConfigurationPanel } from "~/components/vrt/configuration-panel";
import { ControlsPanel, type Layer, type ViewMode } from "~/components/vrt/controls-panel";
import { ComparisonViewer } from "~/components/vrt/comparison-viewer";

const STORAGE_KEY = "manual-vrt-settings";
const DEFAULT_OPACITY = 0.48;

interface StoredSettings {
  viewportWidth: number;
  viewMode: ViewMode;
  layers: Omit<Layer, "screenshotUrl">[];
}

function loadSettings(): StoredSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveSettings(settings: StoredSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

export default component$(() => {
  // Configuration state
  const viewportWidth = useSignal(900);
  const isLoading = useSignal(false);
  const viewMode = useSignal<ViewMode>("overlap");
  const initialized = useSignal(false);

  // Layer state (array order = z-index: first = bottom, last = top)
  const layers = useSignal<Layer[]>([
    {
      id: "layer-1",
      label: "Layer 1",
      url: "",
      screenshotUrl: null,
      opacity: 1,
      offsetY: 0,
      offsetX: 0,
      invert: true,
    },
    {
      id: "layer-2",
      label: "Layer 2",
      url: "",
      screenshotUrl: null,
      opacity: DEFAULT_OPACITY,
      offsetY: 0,
      offsetX: 0,
      invert: true,
    },
  ]);

  const error = useSignal<string | null>(null);

  // Track if we should auto-run comparison (when URLs come from query params)
  const shouldAutoRun = useSignal(false);

  // Initialize from localStorage and query params
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    // Load from localStorage first
    const stored = loadSettings();
    if (stored) {
      viewportWidth.value = stored.viewportWidth;
      viewMode.value = stored.viewMode;
      // Restore layers but clear screenshots
      layers.value = stored.layers.map((l) => ({
        ...l,
        screenshotUrl: null,
      }));
    }

    // Check for URL query parameters (these override localStorage)
    const params = new URLSearchParams(window.location.search);
    const url1 = params.get("url1");
    const url2 = params.get("url2");
    const urlsParam = params.get("urls"); // comma-separated list

    let hasUrlParams = false;

    if (url1 || url2 || urlsParam) {
      let urls: string[] = [];

      if (urlsParam) {
        urls = urlsParam.split(",").map((u) => u.trim()).filter(Boolean);
      } else {
        if (url1) urls.push(url1);
        if (url2) urls.push(url2);
      }

      if (urls.length > 0) {
        hasUrlParams = true;
        // Create layers for each URL from query params
        layers.value = urls.map((url, index) => ({
          id: `layer-${index + 1}`,
          label: `Layer ${index + 1}`,
          url,
          screenshotUrl: null,
          opacity: index === 0 ? 1 : DEFAULT_OPACITY,
          offsetY: 0,
          offsetX: 0,
          invert: true,
        }));
      }
    }

    // Also check for viewMode and viewportWidth in params
    const modeParam = params.get("mode");
    if (modeParam === "overlap" || modeParam === "side-by-side") {
      viewMode.value = modeParam;
    }

    const widthParam = params.get("width");
    if (widthParam) {
      const width = parseInt(widthParam);
      if (!isNaN(width) && width > 0) {
        viewportWidth.value = width;
      }
    }

    initialized.value = true;

    // If URLs were provided via query params, trigger auto-run
    if (hasUrlParams) {
      shouldAutoRun.value = true;
    }
  });

  // Save to localStorage whenever settings change
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => viewportWidth.value);
    track(() => viewMode.value);
    track(() => layers.value);

    if (!initialized.value) return;

    saveSettings({
      viewportWidth: viewportWidth.value,
      viewMode: viewMode.value,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      layers: layers.value.map(({ screenshotUrl: _, ...rest }) => rest),
    });
  });

  const handleAddLayer = $(() => {
    const newId = `layer-${Date.now()}`;
    layers.value = [
      ...layers.value,
      {
        id: newId,
        label: `Layer ${layers.value.length + 1}`,
        url: "",
        screenshotUrl: null,
        opacity: DEFAULT_OPACITY,
        offsetY: 0,
        offsetX: 0,
        invert: true,
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

  // Auto-run comparison when URLs are provided via query params
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => shouldAutoRun.value);

    if (shouldAutoRun.value) {
      shouldAutoRun.value = false;
      handleCompare();
    }
  });

  const handleLayerOpacityChange = $((layerId: string, value: number) => {
    layers.value = layers.value.map((layer) =>
      layer.id === layerId ? { ...layer, opacity: value } : layer,
    );
  });

  const handleLayerOffsetYChange = $((layerId: string, value: number) => {
    layers.value = layers.value.map((layer) =>
      layer.id === layerId ? { ...layer, offsetY: value } : layer,
    );
  });

  const handleLayerOffsetXChange = $((layerId: string, value: number) => {
    layers.value = layers.value.map((layer) =>
      layer.id === layerId ? { ...layer, offsetX: value } : layer,
    );
  });

  const handleLayerInvertChange = $((layerId: string, value: boolean) => {
    layers.value = layers.value.map((layer) =>
      layer.id === layerId ? { ...layer, invert: value } : layer,
    );
  });

  const handleViewModeChange = $((mode: ViewMode) => {
    viewMode.value = mode;
  });

  // Track whether offset changes should be animated (only for auto-align)
  const animateOffset = useSignal(false);

  const handleAutoAlign = $((offsetX: number, offsetY: number) => {
    // Enable animation for auto-align
    animateOffset.value = true;

    // Apply the offset to the top layer (last in array with screenshot)
    const topLayerIndex = layers.value.length - 1;
    const topLayer = layers.value[topLayerIndex];
    if (topLayer) {
      layers.value = layers.value.map((layer, index) =>
        index === topLayerIndex
          ? { ...layer, offsetX, offsetY }
          : layer,
      );
    }

    // Disable animation after transition completes
    setTimeout(() => {
      animateOffset.value = false;
    }, 350);
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
                viewMode={viewMode.value}
                onLayerOpacityChange={handleLayerOpacityChange}
                onLayerOffsetYChange={handleLayerOffsetYChange}
                onLayerOffsetXChange={handleLayerOffsetXChange}
                onLayerInvertChange={handleLayerInvertChange}
                onViewModeChange={handleViewModeChange}
              />
            )}
          </div>

          {/* Right column: Comparison Viewer */}
          <div class="lg:col-span-2">
            <ComparisonViewer
                layers={layers.value}
                viewMode={viewMode.value}
                error={error.value}
                onAutoAlign={handleAutoAlign}
                animateOffset={animateOffset.value}
              />
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
