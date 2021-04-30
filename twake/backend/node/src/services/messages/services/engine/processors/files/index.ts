import { MessageLocalEvent } from "../../../../types";
import { MessageServiceAPI } from "../../../../api";
import { DatabaseServiceAPI } from "../../../../../../core/platform/services/database/api";

export class FilesViewProcessor {
  constructor(readonly database: DatabaseServiceAPI, readonly service: MessageServiceAPI) {}

  async process(message: MessageLocalEvent): Promise<void> {}
}
