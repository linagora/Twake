import { Initializable } from "../../../../../core/platform/framework";
import { LinkPreviewProcessor } from "./service";
import gr from "../../../../global-resolver";
import { LinkPreviewFinishedProcessor } from "./finished";
import { Message } from "../../../../../services/messages/entities/messages";
import Repository from "../../../../../core/platform/services/database/services/orm/repository/repository";

export class LinkPreviewEngine implements Initializable {
  private repository: Repository<Message>;
  async init(): Promise<this> {
    this.repository = await gr.database.getRepository<Message>("messages", Message);

    gr.platformServices.pubsub.processor.addHandler(new LinkPreviewProcessor());
    gr.platformServices.pubsub.processor.addHandler(
      new LinkPreviewFinishedProcessor(this.repository),
    );

    return this;
  }
}
