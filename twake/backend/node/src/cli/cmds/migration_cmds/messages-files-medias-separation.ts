import yargs from "yargs";
import twake from "../../../twake";
import ora from "ora";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { TwakePlatform } from "../../../core/platform/platform";
import gr from "../../../services/global-resolver";
import { MessageFileRef } from "../../../services/messages/entities/message-file-refs";
import { Paginable } from "../../../core/platform/framework/api/crud-service";
import { Pagination } from "../../../core/platform/framework/api/crud-service";
import { fileIsMedia } from "../../../services/files/utils";
import { MessageFile } from "../../../services/messages/entities/message-files";
import _ from "lodash";

type Options = {};

class MessageReferenceRepair {
  database: DatabaseServiceAPI;

  constructor(readonly platform: TwakePlatform) {
    this.database = this.platform.getProvider<DatabaseServiceAPI>("database");
  }

  public async run(options: Options = {}): Promise<void> {
    const repository = await gr.database.getRepository<MessageFileRef>(
      "message_file_refs",
      MessageFileRef,
    );
    const repositoryMessageFile = await gr.database.getRepository<MessageFile>(
      "message_files",
      MessageFile,
    );

    let count = 0;

    let companyPagination: Paginable = new Pagination(null, "100");
    do {
      const companyList = await gr.services.companies.getCompanies(companyPagination);
      companyPagination = companyList.nextPage;

      for (const company of companyList.getEntities()) {
        const companyId: string = company.id;
        const workspaceList = await gr.services.workspaces.getAllForCompany(companyId);

        for (const workspaceId of [...workspaceList.map(w => w.id), "direct"]) {
          const channelsList = await gr.services.channels.channels.getAllChannelsInWorkspace(
            companyId,
            workspaceId,
          );

          for (const channel of channelsList) {
            const channelId = channel.id;
            let filePagination: Pagination = new Pagination(null, "100");

            do {
              const items = await repository.find(
                {
                  target_type: "channel",
                  target_id: channelId,
                  company_id: companyId,
                },
                { pagination: filePagination },
              );

              for (const item of items.getEntities()) {
                try {
                  const msgFile = await repositoryMessageFile.findOne({
                    message_id: item.message_id,
                    id: item.message_file_id,
                  });
                  if (msgFile) {
                    count++;
                    const isMedia = fileIsMedia(msgFile);
                    const ref = _.cloneDeep(item);
                    ref.target_type = isMedia ? "channel_media" : "channel_file";
                    await repository.save(ref);
                  }
                } catch (e) {
                  console.log("Error", e);
                }
              }

              filePagination = new Pagination(items.nextPage.page_token, "100");
            } while (filePagination.page_token);
          }
        }
      }

      console.log("updated files refs: ", count);
    } while (companyPagination.page_token);
  }
}

const services = [
  "search",
  "database",
  "webserver",
  "auth",
  "counter",
  "cron",
  "message-queue",
  "push",
  "realtime",
  "storage",
  "tracker",
  "websocket",
];

const command: yargs.CommandModule<unknown, unknown> = {
  command: "messages-files-medias-separation",
  describe: "command to separate medias and files in messages-files channels refs",
  builder: {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async argv => {
    const spinner = ora({ text: "Fixing messages references - " }).start();
    const platform = await twake.run(services);
    await gr.doInit(platform);
    const migrator = new MessageReferenceRepair(platform);

    await migrator.run({});

    return spinner.stop();
  },
};

export default command;
