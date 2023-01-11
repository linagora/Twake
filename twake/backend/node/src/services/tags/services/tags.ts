import { TwakeServiceProvider, Initializable, logger } from "src/core/platform/framework";
import Repository from "src/core/platform/services/database/services/orm/repository/repository";
import { Tags } from "src/services/tags/entities";
import gr from "../../global-resolver";
import { TYPE } from "src/services/tags/entities/tags";

export class TagsService implements TwakeServiceProvider, Initializable {
  version: "1";
  repository: Repository<Tags>;

  async init(): Promise<this> {
    try {
      this.repository = await gr.database.getRepository<Tags>(TYPE, Tags);
    } catch (err) {
      console.log(err);
      logger.error("Error while initializing applications service");
    }
    return this;
  }

  async get() {
    throw new Error("Not implemented");
  }

  async save() {
    throw new Error("Not implemented");
  }

  async delete() {
    throw new Error("Not implemented");
  }

  list() {
    throw new Error("Not implemented");
  }
}
