import { logger } from "src/core/platform/framework";
import Repository from "src/core/platform/services/database/services/orm/repository/repository";
import globalResolver from "src/services/global-resolver";
import { CompanyExecutionContext } from "../types";
import { DriveFile, TYPE } from "../entities/drive-file";
import { ListResult } from "src/core/platform/framework/api/crud-service";

export class DocumentsService {
  version: "1";
  repository: Repository<DriveFile>;

  async init(): Promise<this> {
    try {
      this.repository = await globalResolver.database.getRepository<DriveFile>(TYPE, DriveFile);
    } catch (error) {
      logger.error("Error while initializing Documents Service", error);
    }

    return this;
  }

  get = (
    id: string,
    context: CompanyExecutionContext,
  ): Promise<DriveFile | ListResult<DriveFile>> => {
    if (!context) {
      return null;
    }

    if (id) {
      return this.repository.findOne(
        {
          id,
          company_id: context.company.id,
        },
        {},
        context,
      );
    }

    return this.repository.find(
      {
        parent_id: "",
        company_id: context.company.id,
      },
      {},
      context,
    );
  };
}
