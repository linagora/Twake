import { TwakeContext } from "../../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { MessageServiceAPI, MessageViewsServiceAPI } from "../../api";
import { Thread } from "../../entities/threads";

export class ViewsService implements MessageViewsServiceAPI {
  version: "1";
  repository: Repository<Thread>;

  constructor(private database: DatabaseServiceAPI, private service: MessageServiceAPI) {}

  async init(context: TwakeContext): Promise<this> {
    return this;
  }
}
