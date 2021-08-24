import sharp from "sharp";
import { unlink } from "fs/promises";

export async function generatePreview(inputPath: string, outputPath: string) {
  var result: sharp.OutputInfo;
  try {
    result = await sharp(inputPath).resize(300, 200).toFile(outputPath);
    await unlink(inputPath);
    console.log("successfully deleted : ", inputPath);
  } catch (error) {
    console.error("there was an error:", error.message);
  }
  return result;
}
