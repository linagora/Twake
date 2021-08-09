import { PDFImage } from "pdf-image";
import { unlink } from "fs/promises";

export async function convertFromPdf(inputPath: string, numberOfPages: number) {
  var pdfImage = new PDFImage(inputPath);
  const imagePath = await pdfImage.convertFile().catch((e: any) => {
    throw e;
  });
  try {
    await unlink(inputPath);
    console.log("successfully deleted : ", inputPath);
  } catch (error) {
    console.error("there was an error:", error.message);
  }

  return `${inputPath.substring(0, inputPath.length - 4)}-0.png`; //attention plusieur fichier
}
