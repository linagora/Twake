import sharp from "sharp";
import { promises as fsPromise } from "fs";
import { getTmpFile } from "../../utils";
import { PreviewPubsubRequest, ThumbnailResult } from "../../types";

const { unlink } = fsPromise;

export async function generatePreview(
  inputPaths: string[],
  options: PreviewPubsubRequest["output"],
): Promise<{
  output: ThumbnailResult[];
  done: boolean;
}> {
  const output: ThumbnailResult[] = [];

  for (const inputPath of inputPaths) {
    let result: sharp.OutputInfo;

    try {
      const outputPath = getTmpFile();
      const inputMetadata = await sharp(inputPath).metadata();
      const outputFormat = computeNewFormat(inputMetadata, options);

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

function computeNewFormat(
  inputMetadata: sharp.Metadata,
  options?: PreviewPubsubRequest["output"],
): { width: number; height: number } {
  const maxOutputWidth = options?.width || 300;
  const maxOutputHeight = options?.height || 200;
  const inputWidth = inputMetadata.width;
  const inputHeight = inputMetadata.height;
  const scale = Math.max(inputWidth / maxOutputWidth, inputHeight / maxOutputHeight);

  return { width: Math.round(inputWidth / scale), height: Math.round(inputHeight / scale) };
}
