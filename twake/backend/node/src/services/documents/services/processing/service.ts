import globalResolver from "../../../../services/global-resolver";
import { Initializable, logger, TwakeServiceProvider } from "../../../../core/platform/framework";
import { CompanyExecutionContext, exportKeywordPayload } from "../../types";
import { extractKeywords, readableToString } from "../../utils";

export class DocumentsProcessService implements TwakeServiceProvider, Initializable {
  name: "DocumentsProcessService";
  version: "1";

  init = async (): Promise<this> => {
    return this;
  };

  process = async (payload: exportKeywordPayload): Promise<string> => {
    try {
      const context = {
        company: { id: payload.company_id },
      };

      const storedFile = await globalResolver.services.files.download(
        payload.file_id,
        context as CompanyExecutionContext,
      );

      if (!storedFile || !storedFile.file) {
        throw Error("File doesn't exist");
      }

      const fileString = await readableToString(storedFile.file);

      return extractKeywords(fileString);
    } catch (error) {
      logger.error("Failed to extract content keywords from file", error);
      throw Error("Failed to extract content keywords");
    }
  };
}
