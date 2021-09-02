import sharp, { Sharp } from "sharp";
import { unlink } from "fs/promises";
import { getTmpFile } from "../../utils";
import { ThumbnailResult } from "../../types";

export async function generatePreview(
  inputPaths: string[],
): Promise<{
  output: ThumbnailResult[];
  done: boolean;
}> {
  let output: ThumbnailResult[] = [];

  for (const inputPath of inputPaths) {
    var result: sharp.OutputInfo;

    try {
      const outputPath = getTmpFile();
      const inputMetadata = await sharp(inputPath).metadata();
      const outputFormat = computeNewFormat(inputMetadata);

      result = await sharp(inputPath).resize(outputFormat).toFile(outputPath);
      output.push({
        path: outputPath,
        width: result.width,
        height: result.height,
        type: "image/png",
        size: result.size,
      });
    } catch (error) {
      console.error("there was an error:", error.message);
      return { output: [], done: false };
    }
    await unlink(inputPath);
  }

  return {
    output,
    done: true,
  };
}

function computeNewFormat(inputMetadata: sharp.Metadata): { width: number; height: number } {
  const maxOutputWidth = 300;
  const maxOutputHeight = 200;

  const inputWidth = inputMetadata.width;
  const inputHeight = inputMetadata.height;

  const scale = Math.max(inputWidth / maxOutputWidth, inputHeight / maxOutputHeight);
  let output = { width: Math.round(inputWidth / scale), height: Math.round(inputHeight / scale) };

  return output;
}
