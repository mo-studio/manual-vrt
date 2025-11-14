import { component$, useSignal, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ConfigurationPanel } from "~/components/vrt/configuration-panel";
import { ControlsPanel } from "~/components/vrt/controls-panel";
import { ComparisonViewer } from "~/components/vrt/comparison-viewer";

export default component$(() => {
  // Configuration state
  const baseUrlA = useSignal("");
  const baseUrlB = useSignal("");
  const path = useSignal("");
  const viewportWidth = useSignal(900);
  const viewportHeight = useSignal(1440);
  const isLoading = useSignal(false);

  // Control state
  const opacity = useSignal(0.5);
  const topLayer = useSignal<"A" | "B">("A");
  const offsetA = useSignal(0);
  const offsetB = useSignal(0);

  // Screenshot state
  const screenshotA = useSignal<string | null>(null);
  const screenshotB = useSignal<string | null>(null);
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
        viewportHeight: viewportHeight.value,
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
    screenshotA.value = null;
    screenshotB.value = null;

    try {
      const urlA = baseUrlA.value.trim() + path.value.trim();
      const urlB = baseUrlB.value.trim() + path.value.trim();

      // Capture both screenshots in parallel
      const [screenshotUrlA, screenshotUrlB] = await Promise.all([
        captureScreenshot(urlA),
        captureScreenshot(urlB),
      ]);

      screenshotA.value = screenshotUrlA;
      screenshotB.value = screenshotUrlB;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "An error occurred";
    } finally {
      isLoading.value = false;
    }
  });

  const handleResetOffsets = $(() => {
    offsetA.value = 0;
    offsetB.value = 0;
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
              baseUrlA={baseUrlA.value}
              baseUrlB={baseUrlB.value}
              path={path.value}
              viewportWidth={viewportWidth.value}
              viewportHeight={viewportHeight.value}
              isLoading={isLoading.value}
              onBaseUrlAChange={$((value: string) => {
                baseUrlA.value = value;
              })}
              onBaseUrlBChange={$((value: string) => {
                baseUrlB.value = value;
              })}
              onPathChange={$((value: string) => {
                path.value = value;
              })}
              onViewportWidthChange={$((value: number) => {
                viewportWidth.value = value;
              })}
              onViewportHeightChange={$((value: number) => {
                viewportHeight.value = value;
              })}
              onCompare={handleCompare}
            />

            {(screenshotA.value || screenshotB.value) && (
              <ControlsPanel
                opacity={opacity.value}
                topLayer={topLayer.value}
                offsetA={offsetA.value}
                offsetB={offsetB.value}
                onOpacityChange={$((value: number) => {
                  opacity.value = value;
                })}
                onTopLayerChange={$((value: "A" | "B") => {
                  topLayer.value = value;
                })}
                onOffsetAChange={$((value: number) => {
                  offsetA.value = value;
                })}
                onOffsetBChange={$((value: number) => {
                  offsetB.value = value;
                })}
                onResetOffsets={handleResetOffsets}
              />
            )}
          </div>

          {/* Right column: Comparison Viewer */}
          <div class="lg:col-span-2">
            <ComparisonViewer
              screenshotA={screenshotA.value}
              screenshotB={screenshotB.value}
              opacity={opacity.value}
              topLayer={topLayer.value}
              offsetA={offsetA.value}
              offsetB={offsetB.value}
              error={error.value}
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
