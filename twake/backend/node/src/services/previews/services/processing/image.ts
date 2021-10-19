import sharp from "sharp";
import { cleanFiles, getTmpFile } from "../../utils";
import { PreviewPubsubRequest, ThumbnailResult } from "../../types";
import { logger } from "../../../../core/platform/framework/logger";

export async function generatePreview(
  inputPaths: string[],
  options: PreviewPubsubRequest["output"],
  deleteInputFile: boolean,
): Promise<{
  output: ThumbnailResult[];
  done: boolean;
  error?: string;
}> {
  const output: ThumbnailResult[] = [];

  for (const inputPath of inputPaths) {
    var result: sharp.OutputInfo;
    const outputPath = getTmpFile();
    try {
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
      logger.info(`sharp cant process ${error}`);
      cleanFiles([outputPath]);
      throw Error("Can't resize thumnail with Sharp");
    }
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
