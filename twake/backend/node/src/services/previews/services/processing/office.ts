import * as unoconv from "unoconv-promise";
import { promises as fsPromise } from "fs";
import { logger } from "../../../../core/platform/framework/logger";

const { unlink } = fsPromise;

export async function convertFromOffice(
  path: string,
  numberOfPages: number,
): Promise<{ output: string; done: boolean }> {
  if (numberOfPages >= 1) {
    const outputPath = `${path.split(".")[0]}_temp`;
    const processOutputPath = outputPath.split("/");
    processOutputPath.pop();
    try {
      await unoconv.run({
        file: path,
        output: `${path}.pdf`,
        export: `PageRange=1-${numberOfPages}`,
      });
    } catch (err) {
      logger.error(`unoconv cant process ${err}`);
      return { output: "", done: false };
    }
    await unlink(path);

    return { output: `${path}.pdf`, done: true };
  }
}
