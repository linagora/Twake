import { PDFImage } from "pdf-image";
import { unlink } from "fs/promises";

export async function convertFromPdf(inputPath: string, numberOfPages: number) {
  const pdfImage = new PDFImage(inputPath);
  const imagePath = await pdfImage.convertFile().catch((error: any) => {
    console.error("there was an error:", error.message);
  });
  try {
    await unlink(inputPath);
    console.log("successfully deleted : ", inputPath);
  } catch (error) {
    console.error("there was an error:", error.message);
  }
  return inputPath.replace(".pdf", "-0.png"); //attention plusieur fichier
}
