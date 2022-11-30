import { logger } from "src/core/platform/framework";
import Repository from "src/core/platform/services/database/services/orm/repository/repository";
import globalResolver from "src/services/global-resolver";
import { CompanyExecutionContext } from "../types";
import { DriveFile, TYPE } from "../entities/drive-file";
import {
  CrudException,
  ListResult,
  Pagination,
} from "src/core/platform/framework/api/crud-service";
import { Multipart } from "fastify-multipart";

export class DocumentsService {
  version: "1";
  repository: Repository<DriveFile>;
  ROOT: "";

  async init(): Promise<this> {
    try {
      this.repository = await globalResolver.database.getRepository<DriveFile>(TYPE, DriveFile);
    } catch (error) {
      logger.error("Error while initializing Documents Service", error);
    }

    return this;
  }

  /**
   * Fetches a drive element
   *
   * @param {string} id
   * @param {Pagination} pagination
   * @param {CompanyExecutionContext} context
   * @returns
   */
  get = async (
    id: string,
    pagination: Pagination,
    context: CompanyExecutionContext,
  ): Promise<ListResult<DriveFile>> => {
    if (!context) {
      return null;
    }

    if (!id || !id.length) {
      return this.repository.find(
        {
          parent_id: this.ROOT,
          is_instrash: false,
          company_id: context.company.id,
        },
        { pagination },
        context,
      );
    }

    if (id === "trash") {
      return this.repository.find(
        {
          parent_id: this.ROOT,
          is_instrash: true,
          company_id: context.company.id,
        },
        { pagination },
        context,
      );
    }

    const entity = await this.repository.findOne(
      {
        id,
        company_id: context.company.id,
      },
      {},
      context,
    );

    if (!entity) {
      return null;
    }

    if (!entity.is_directory) return new ListResult<DriveFile>(TYPE, [entity]);

    const children = await this.repository.find(
      {
        parent_id: id,
        company_id: context.company.id,
      },
      { pagination },
      context,
    );

    return new ListResult<DriveFile>(TYPE, [entity, ...children.getEntities()], children.nextPage);
  };

  create = async (
    file: Partial<DriveFile>,
    content: Multipart | null,
    context: CompanyExecutionContext,
  ): Promise<DriveFile> => {};

  /**
   * deletes or moves to Trash a Drive Document
   *
   * @param {string} id - the item id
   * @param {CompanyExecutionContext} context - the execution context
   * @returns {Promise<void>}
   */
  delete = async (id: string, context: CompanyExecutionContext): Promise<void> => {
    const item = await this.repository.findOne(
      {
        id,
        company_id: context.company.id,
      },
      {},
      context,
    );

    if (!item) {
      throw new CrudException("File not found", 404);
    }

    if (item.is_instrash) {
      return await this.repository.remove(item);
    }

    if (item.is_directory) {
      await this.moveDirectoryContentsTotrash(item.id, context);
    }

    return await this.repository.save({
      ...item,
      is_instrash: true,
      parent_id: this.ROOT,
    });
  };

  /**
   * Recursively move directory contents to trash
   *
   * @param {string} id - the directory id
   * @param {CompanyExecutionContext} context - the execution context
   * @returns {Promise<void>}
   */
  private moveDirectoryContentsTotrash = async (
    id: string,
    context?: CompanyExecutionContext,
  ): Promise<void> => {
    const children = await this.repository.find({
      company_id: context.company.id,
      parent_id: id,
    });

    children.getEntities().forEach(async child => {
      await this.repository.save({
        ...child,
        parent_id: this.ROOT,
        is_instrash: true,
      });

      if (child.is_directory) {
        return await this.moveDirectoryContentsTotrash(child.id, context);
      }
    });
  };
}
