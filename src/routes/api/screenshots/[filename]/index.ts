import type { RequestHandler } from "@builder.io/qwik-city";
import fs from "fs/promises";
import path from "path";

export const onGet: RequestHandler = async ({ params, send, status, headers }) => {
  const { filename } = params;

  // Validate filename to prevent path traversal attacks
  if (!filename || filename.includes("..") || filename.includes("/")) {
    status(400);
    send(400, "Invalid filename");
    return;
  }

  const screenshotPath = path.join(
    process.cwd(),
    "public",
    "screenshots",
    filename
  );

  try {
    // Check if file exists and is readable
    await fs.access(screenshotPath, fs.constants.R_OK);

    // Read the file
    const fileBuffer = await fs.readFile(screenshotPath);

    // Set appropriate headers
    headers.set("Content-Type", "image/png");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    send(200, fileBuffer);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Failed to serve screenshot: ${filename}`,
      error
    );
    status(404);
    send(404, "Screenshot not found");
  }
};
