import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { TwakePlatform } from "../../../core/platform/platform";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { ChannelMember, ChannelMemberReadCursors } from "../../../services/channels/entities";
import {
  ExecutionContext,
  Paginable,
  Pagination,
} from "../../../core/platform/framework/api/crud-service";
import gr from "../../../services/global-resolver";
import yargs from "yargs";
import ora from "ora";
import twake from "../../../twake";

class ChannelMemberReadCursorsMigrator {
  readSectionRepository: Repository<ChannelMemberReadCursors>;
  database: DatabaseServiceAPI;

  constructor(readonly platform: TwakePlatform) {
    this.database = this.platform.getProvider<DatabaseServiceAPI>("database");
  }

  public async run(options = {}, context?: ExecutionContext): Promise<void> {
    const companyPagination: Paginable = new Pagination(null, "100");
    const companies = await gr.services.companies.getCompanies(companyPagination);

    context.user.server_request = true;

    for (const company of companies.getEntities()) {
      const { id: CompanyId } = company;

      const workspaces = await gr.services.workspaces.getAllForCompany(CompanyId);
      const workspaceIds = [...workspaces.map(({ id }) => id), "direct"];

      for (const workspaceId of workspaceIds) {
        const channels = await gr.services.channels.channels.getAllChannelsInWorkspace(
          CompanyId,
          workspaceId,
        );

        for (const channel of channels) {
          const { id: channelId } = channel;
          const membersPagination: Pagination = new Pagination(null, "100");
          const threadsPagination: Pagination = new Pagination(null, "1");
          let members: ChannelMember[];

          try {
            const membersList = await gr.services.channels.members.list(
              membersPagination,
              {},
              {
                ...context,
                channel: {
                  company_id: CompanyId,
                  id: channelId,
                  workspace_id: workspaceId,
                },
              },
            );
            members = membersList.getEntities();
          } catch (error) {
            continue;
          }

          let lastMessage = await gr.services.messages.views.listChannel(
            threadsPagination,
            {},
            {
              ...context,
              channel: {
                company_id: CompanyId,
                id: channelId,
                workspace_id: workspaceId,
              },
              user: {
                id: null,
              },
            },
          );

          const firstMessage = await gr.services.messages.views.listChannel(
            {
              ...threadsPagination,
              reversed: true,
            },
            {},
            {
              ...context,
              channel: {
                company_id: CompanyId,
                id: channelId,
                workspace_id: workspaceId,
              },
              user: {
                id: null,
              },
            },
          );

          if (!firstMessage.getEntities().length) {
            continue;
          }

          if (!lastMessage.getEntities().length) {
            lastMessage = firstMessage;
          }

          const firstMessageId = firstMessage.getEntities()[0].id;
          const lastMessageId = lastMessage.getEntities()[0].id;

          if (!firstMessageId) {
            continue;
          } else {
            for (const member of members) {
              await gr.services.channels.members.setChannelMemberReadSections(
                {
                  start: firstMessageId,
                  end: lastMessageId,
                },
                {
                  ...context,
                  channel_id: channelId,
                  workspace_id: workspaceId,
                  company: {
                    id: CompanyId,
                  },
                  user: {
                    id: member.user_id,
                  },
                },
              );
            }
          }
        }
      }
    }
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
  "email-pusher",
];

const command: yargs.CommandModule<unknown, unknown> = {
  command: "channel-member-read-cursor-repair",
  describe: "fixes the channel members read cursors for old messages",
  builder: {},

  handler: async () => {
    const spinner = ora({ text: "Fixing channel members read cursors" }).start();
    const platform = await twake.run(services);
    await gr.doInit(platform);
    const migrator = new ChannelMemberReadCursorsMigrator(platform);

    await migrator.run({});

    return spinner.stop();
  },
};

export default command;
