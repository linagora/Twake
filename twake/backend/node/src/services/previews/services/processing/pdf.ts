import { PDFImage } from "pdf-image";
import { unlink } from "fs/promises";

export async function convertFromPdf(
  inputPath: string,
  numberOfPages: number,
): Promise<{ output: string[]; done: boolean }> {
  console.log("Start conversion with imagick");

  let pages: string[] = [];

  try {
    const pdfImage = new PDFImage(inputPath);

    numberOfPages = 1; //Fixme: We cannot generate more page because of a library bug right now

    for (let i = 0; i < numberOfPages; i++) {
      const newPage = await pdfImage.convertPage(i);
      pages.push(newPage);
    }

    await unlink(inputPath);
    console.log("successfully deleted : ", inputPath);
  } catch (error) {
    console.error("there was an error:", error.message);
    return { output: [], done: false };
  }

  console.log(pages);

  return { output: pages, done: true }; //attention plusieur fichier
}
