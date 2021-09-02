import { FilePubsubHandler, FileServiceAPI } from "../api";
import { logger, TwakeContext } from "../../../core/platform/framework";
import _ from "lodash";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { PreviewPubsubCallback } from "../../../../src/services/previews/types";
import Repository from "../../../../src/core/platform/services/database/services/orm/repository/repository";
import { File } from "../entities/file";

/**
 * Push new message notification to a set of users
 */
export class PreviewFinishedProcessor implements FilePubsubHandler<PreviewPubsubCallback, string> {
  repository: Repository<File>;

  constructor(
    readonly service: FileServiceAPI,
    private pubsub: PubsubServiceAPI,
    repository: Repository<File>,
  ) {
    this.service = service;
    this.repository = repository;
  }

  //readonly service: FileServiceAPI;
  init?(context?: TwakeContext): Promise<this> {
    throw new Error("Method not implemented.");
  }

  readonly topics = {
    in: "services:preview:callback",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  name = "FilePreviewProcessor";

  validate(message: PreviewPubsubCallback): boolean {
    return !!true;
  }

  async process(message: PreviewPubsubCallback): Promise<string> {
    logger.info(
      `${this.name} - Updating file metadata with preview generation ${message.thumbnails}`,
    );

    const pk: { company_id: string; id: string } = JSON.parse(message.document.id);
    const entity = await this.repository.findOne(pk);

    if (!entity) {
      logger.info(`This file ${message.document.id} does not exists anymore.`);
      return;
    }

    entity.thumbnails = message.thumbnails.map((thumb, index) => {
      return {
        index,
        id: thumb.path.split("/").pop(),
        size: thumb.size,
        type: thumb.type,
        width: thumb.width,
        height: thumb.height,
      };
    });

    await this.repository.save(entity);
    return "done";
  }
}
