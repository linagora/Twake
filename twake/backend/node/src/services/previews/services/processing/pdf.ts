import { PDFImage } from "pdf-image";
import { promises as fsPromise } from "fs";

const { unlink } = fsPromise;

export async function convertFromPdf(
  inputPath: string,
  numberOfPages: number,
): Promise<{ output: string[]; done: boolean }> {
  const pages: string[] = [];

  try {
    const pdfImage = new PDFImage(inputPath);

    numberOfPages = 1; //Fixme: We cannot generate more page because of a library bug right now

    for (let i = 0; i < numberOfPages; i++) {
      const newPage = await pdfImage.convertPage(i);
      pages.push(newPage);
    }
  } catch (error) {
    console.error("there was an error:", error.message);
    return { output: [], done: false };
  }
  await unlink(inputPath);

  return { output: pages, done: true };
}
