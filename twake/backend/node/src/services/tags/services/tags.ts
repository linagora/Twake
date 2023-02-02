import { TwakeServiceProvider, Initializable } from "src/core/platform/framework/api";
import Repository from "src/core/platform/services/database/services/orm/repository/repository";
import { Tags, TagsType, TagsPrimaryKey } from "../entities";
import gr from "../../global-resolver";
import {
  DeleteResult,
  ExecutionContext,
  ListResult,
  OperationType,
  SaveResult,
} from "../../../core/platform/framework/api/crud-service";
import { plainToClass } from "class-transformer";
import { createTagEntity, TYPE } from "../entities/tags";
import { logger } from "../../../core/platform/framework";

export class TagsService implements TwakeServiceProvider, Initializable {
  version: "1";
  repository: Repository<Tags>;

  async init(): Promise<this> {
    try {
      this.repository = await gr.database.getRepository<Tags>(TYPE, Tags);
    } catch (err) {
      console.log(err);
      logger.error("Error while initializing tags service");
    }
    return this;
  }

  async get(pk: TagsPrimaryKey): Promise<Tags> {
    return await this.repository.findOne({ company_id: pk.company_id, tag_id: pk.tag_id });
  }

  async save(tag: Tags, context: ExecutionContext): Promise<SaveResult<Tags>> {
    const tagToSave = createTagEntity(tag);
    tagToSave.tag_id = tag.name.toLocaleLowerCase().replace(/[^a-z0-9]/gm, "_");
    await this.repository.save(tagToSave, context);
    return new SaveResult(TagsType, tagToSave, OperationType.CREATE);
  }

  async delete(pk: TagsPrimaryKey, context: ExecutionContext): Promise<DeleteResult<Tags>> {
    const tag = await this.get(pk);
    const entity = createTagEntity(tag);
    await this.repository.remove(entity, context);
    return new DeleteResult(TagsType, entity, true);
  }

  async list(pk: { company_id: string }): Promise<ListResult<Tags>> {
    const result = await this.repository.find({
      company_id: pk.company_id,
    });

    return new ListResult<Tags>(
      "tags",
      result.getEntities().map(tag => plainToClass(Tags, { tag_id: tag.tag_id, ...tag })),
      result.nextPage,
    );
  }
}
