import yargs from "yargs";
import twake from "../../../twake";
import ora from "ora";
import { TwakePlatform } from "../../../core/platform/platform";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import {
  ExecutionContext,
  Paginable,
  Pagination,
} from "../../../core/platform/framework/api/crud-service";
import User, { TYPE as userTYPE } from "../../../services/user/entities/user";
import _ from "lodash";
import gr from "../../../services/global-resolver";
import { getInstance, MessageFileRef } from "../../../services/messages/entities/message-file-refs";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import uuid from "node-uuid";
import { MessageFile } from "../../../services/messages/entities/message-files";

type Options = {};

class MessageFilesCacheMigrator {
  database: DatabaseServiceAPI;
  repository: Repository<MessageFileRef>;
  messageFileRepository: Repository<MessageFile>;

  constructor(readonly platform: TwakePlatform) {
    this.database = this.platform.getProvider<DatabaseServiceAPI>("database");
  }

  public async run(options: Options = {}): Promise<void> {
    this.repository = await gr.database.getRepository<MessageFileRef>(
      "message_file_refs",
      MessageFileRef,
    );
    this.messageFileRepository = await gr.database.getRepository<MessageFile>(
      "message_files",
      MessageFile,
    );

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

            let threadPagination: Paginable = new Pagination(null, "100");
            do {
              const threadList = await gr.services.messages.views.listChannelThreads(
                threadPagination,
                {},
                {
                  channel: {
                    company_id: companyId,
                    workspace_id: workspaceId,
                    id: channelId,
                  },
                  user: { id: null },
                },
              );

              for (const thread of threadList.getEntities()) {
                let messagesPagination: Paginable = new Pagination(null, "100");
                do {
                  const messagesList = await gr.services.messages.messages.list(
                    messagesPagination,
                    {},
                    {
                      thread: { id: thread.id },
                      company: { id: companyId },
                      workspace: { id: workspaceId },
                      channel: { id: channelId },
                      user: { id: null },
                    } as ExecutionContext,
                  );
                  messagesPagination = messagesList.nextPage;

                  for (const message of messagesList.getEntities()) {
                    if (message.files && message.files.length > 0) {
                      for (const _messageFile of message.files) {
                        const messageFile = await this.messageFileRepository.findOne({
                          message_id: message.id,
                          id: _messageFile.id,
                        });
                        if (messageFile) {
                          //Update user uploads
                          const fileRef = getInstance({
                            target_type: "user_upload",
                            target_id: message.user_id,
                            id: uuid.v1({ msecs: message.created_at }),
                            created_at: message.created_at,
                            company_id: companyId,
                            workspace_id: workspaceId,
                            channel_id: channelId,
                            thread_id: message.thread_id,
                            message_id: message.id,
                            message_file_id: messageFile.id,
                            file_id: messageFile.metadata.external_id,
                          });
                          await this.repository.save(fileRef);

                          //Update messageFileRepository

                          messageFile.cache = {
                            company_id: companyId,
                            workspace_id: workspaceId,
                            channel_id: channelId,
                            user_id: message.user_id,
                          };
                          messageFile.thread_id = message.thread_id;

                          await this.messageFileRepository.save(messageFile);
                        }
                      }
                    }
                  }
                } while (messagesPagination.page_token);
              }

              threadPagination = threadList.nextPage;
              threadPagination.page_token =
                threadPagination.page_token && threadList.getEntities()?.[0]?.thread_id;
            } while (threadPagination.page_token);
          }
        }
      }
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
  "pubsub",
  "push",
  "realtime",
  "storage",
  "tracker",
  "websocket",
];

const command: yargs.CommandModule<unknown, unknown> = {
  command: "message-files-cache",
  describe: "command that allow you to fix cache for each message-file refs",
  builder: {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async argv => {
    const spinner = ora({ text: "Migrating messages - " }).start();
    const platform = await twake.run(services);
    await gr.doInit(platform);
    const migrator = new MessageFilesCacheMigrator(platform);

    await migrator.run({});

    return spinner.stop();
  },
};

export default command;
