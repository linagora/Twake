import sharp from "sharp";
import { unlink } from "fs/promises";
import * as fs from "fs";

export async function generatePreview(
  inputPaths: string[],
): Promise<{ output: { path: string; width: number; height: number }[]; done: boolean }> {
  console.log("Start conversion with sharp");

  let output: { path: string; width: number; height: number }[] = [];
  const out = fs.createWriteStream("/usr/src/app/src/services/previews/previews.png");

  for (const inputPath of inputPaths) {
    var result: sharp.OutputInfo;
    try {
      result = await sharp(inputPath)
        .resize(300, 200)
        .toFile("/usr/src/app/src/services/previews/previews.png"); //FIX ME
      output.push({
        path: inputPath,
        width: result.width,
        height: result.height,
      });

      await unlink(inputPath);
      console.log("successfully deleted : ", inputPath);
    } catch (error) {
      console.error("there was an error:", error.message);
      return { output: [], done: false };
    }
  }

  return {
    output,
    done: true,
  };
}
