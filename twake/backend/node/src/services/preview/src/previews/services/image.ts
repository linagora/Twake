import sharp from "sharp";

export function generatePreview(inputPath: string, outputPath: string, outputFormat: string) {
  outputFormat = "png";
  sharp(inputPath)
    .resize(300, 200)
    .toFile(`${outputPath}.${outputFormat}`, function (err) {});
}
