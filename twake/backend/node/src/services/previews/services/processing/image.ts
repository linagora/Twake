import sharp from "sharp";
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
      result = await sharp(inputPath).resize(300, 200).toFile(outputPath); //FIX ME: put in parameter the resize format
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
