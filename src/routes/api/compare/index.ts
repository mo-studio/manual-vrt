import type { RequestHandler } from "@builder.io/qwik-city";
import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

interface CompareRequest {
  url: string;
  viewportWidth?: number;
  viewportHeight?: number;
}

interface CompareResponse {
  screenshotUrl: string;
  metadata: {
    viewportWidth: number;
    viewportHeight: number;
    capturedAt: string;
    url: string;
  };
}

interface ErrorResponse {
  error: string;
}

export const onPost: RequestHandler = async ({ json, request }) => {
  try {
    const body = (await request.json()) as CompareRequest;
    const { url, viewportWidth = 900, viewportHeight = 1440 } = body;

    // Validate URL
    if (!url) {
      json(400, { error: "URL is required" } as ErrorResponse);
      return;
    }

    try {
      new URL(url);
    } catch {
      json(400, { error: "Invalid URL format" } as ErrorResponse);
      return;
    }

    console.log(`[${new Date().toISOString()}] Capturing screenshot for: ${url}`);

    // Launch browser
    const browser = await chromium.launch({
      headless: true,
    });

    try {
      const context = await browser.newContext({
        viewport: {
          width: viewportWidth,
          height: viewportHeight,
        },
      });

      const page = await context.newPage();

      // Navigate to URL
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Auto-scroll to trigger lazy-loaded content
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              // Scroll back to top
              window.scrollTo(0, 0);
              resolve();
            }
          }, 100);
        });
      });

      // Wait a bit for any animations to settle
      await page.waitForTimeout(500);

      // Generate unique filename
      const hash = crypto.createHash("md5").update(url).digest("hex");
      const timestamp = Date.now();
      const filename = `${timestamp}-${hash}.png`;
      const screenshotPath = path.join(
        process.cwd(),
        "public",
        "screenshots",
        filename
      );

      // Ensure directory exists
      await fs.mkdir(path.dirname(screenshotPath), { recursive: true });

      // Capture full-page screenshot
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      await context.close();

      const metadata = {
        viewportWidth,
        viewportHeight,
        capturedAt: new Date().toISOString(),
        url,
      };
      
      // TODO: Save the metadata to file

      console.log(
        `[${new Date().toISOString()}] Screenshot saved: /screenshots/${filename}`
      );

      json(200, {
        screenshotUrl: `/screenshots/${filename}`,
        metadata,
      } as CompareResponse);
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Screenshot capture failed:`,
      error
    );

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    json(500, {
      error: `Failed to capture screenshot: ${errorMessage}`,
    } as ErrorResponse);
  }
};
