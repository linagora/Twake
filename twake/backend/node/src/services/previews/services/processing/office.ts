const unoconv = require("unoconv-promise");
import { unlink } from "fs/promises";

export async function convertFromOffice(
  path: string,
  numberOfPages: number,
): Promise<{ output: string; done: boolean }> {
  if (numberOfPages >= 1) {
    const outputPath = `${path.split(".")[0]}_temp`;
    const processOutputPath = outputPath.split("/");
    processOutputPath.pop();
    const output = `${processOutputPath.join("/")}/${outputPath.split("/").pop()}`;
    try {
      await unoconv.run({
        file: path,
        output: `${path}.pdf`,
        export: `PageRange=1-${numberOfPages}`,
      });
    } catch (err) {
      console.log(err);
      return { output: "", done: false };
    }
    await unlink(path);

    return { output: `${path}.pdf`, done: true };
  }
}
