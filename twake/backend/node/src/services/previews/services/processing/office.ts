const unoconv = require("unoconv-promise");
import { logger } from "../../../../core/platform/framework/logger";
import { cleanFile } from "../../utils";

export async function convertFromOffice(
  path: string,
  numberOfPages: number,
  deleteInputFile: boolean,
): Promise<{ output: string; done: boolean }> {
  if (numberOfPages >= 1) {
    const outputPath = `${path}.pdf`;
    try {
      await unoconv.run({
        file: path,
        output: outputPath,
        export: `PageRange=1-${numberOfPages}`,
      });
    } catch (err) {
      logger.error(`unoconv cant process ${err}`);
      cleanFile(outputPath);
      throw Error("Can't convert file with unoconv");
    }
    if (deleteInputFile) cleanFile(path);
    return { output: outputPath, done: true };
  } else {
    logger.error(`Unoconv can't processe, number of pages lower than 1`);
  }
}
