import sharp from "sharp";
import { unlink } from "fs/promises";

export async function generatePreview(inputPath: string, outputPath: string, outputFormat: string) {
  outputFormat = "png";

  await sharp(inputPath)
    .resize(300, 200)
    .toFile(`${outputPath}.${outputFormat}`, function (err) {});

  try {
    await unlink(inputPath);
    console.log("successfully deleted : ", inputPath);
  } catch (error) {
    console.error("there was an error:", error.message);
  }
}
