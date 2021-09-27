import { fromPath } from "pdf2pic";
import { promises as fsPromise } from "fs";
import { getTmpFile } from "../../utils";

const { unlink } = fsPromise;

export async function convertFromPdf(
  inputPath: string,
  numberOfPages: number,
): Promise<{ output: string[]; done: boolean }> {
  const pages: string[] = [];

  try {
    const options = {
      density: 100,
      saveFilename: "output",
      savePath: getTmpFile(),
      format: "png",
    };
    const storeAsImage = fromPath(inputPath, options);
    const images = await storeAsImage.bulk(numberOfPages);
    for (const image of images) {
      pages.push(`${options.savePath}/${options.saveFilename}.${image.page}.${options.format}`);
    }
  } catch (error) {
    console.error("there was an error:", error.message);
    return { output: [], done: false };
  }
  await unlink(inputPath);

  return { output: pages, done: true };
}
