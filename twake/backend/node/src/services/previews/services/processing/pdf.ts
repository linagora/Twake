import { PDFImage } from "pdf-image";
import { existsSync } from "fs";
import { cleanFile } from "../../utils";

export async function convertFromPdf(
  inputPath: string,
  numberOfPages: number,
  deleteInputFile: boolean,
): Promise<{ output: string[]; done: boolean }> {
  let pages: string[] = [];

  try {
    const pdfImage = new PDFImage(inputPath);

    numberOfPages = 1; //Fixme: We cannot generate more page because of a library bug right now

    for (let i = 0; i < numberOfPages; i++) {
      const newPage = await pdfImage.convertPage(i);
      pages.push(newPage);
    }
  } catch (error) {
    console.error("there was an error:", error.message);
    for (const file of pages) {
      if (existsSync(file)) cleanFile(file);
    }
    throw Error("Can't convert file with pdf-image.");
  }
  if (deleteInputFile) cleanFile(inputPath);
  return { output: pages, done: true };
}
