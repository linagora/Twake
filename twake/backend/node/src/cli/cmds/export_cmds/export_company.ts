import yargs from "yargs";
import twake from "../../../twake";
import UserServiceAPI from "../../../services/user/api";
import { mkdirSync, writeFileSync } from "fs";
import { WorkspaceServiceAPI } from "../../../services/workspaces/api";
import { Pagination } from "../../../core/platform/framework/api/crud-service";
import WorkspaceUser from "../../../services/workspaces/entities/workspace_user";
import { ApplicationServiceAPI } from "../../../services/applications/api";
import ChannelServiceAPI from "../../../services/channels/provider";
import { ChannelVisibility } from "../../../services/channels/types";
import { Channel } from "../../../services/channels/entities";
import { MessageServiceAPI } from "../../../services/messages/api";
import { Thread } from "../../../services/messages/entities/threads";
import { Message } from "../../../services/messages/entities/messages";
import { MessageWithReplies } from "../../../services/messages/types";

/**
 * Merge command parameters. Check the builder definition below for more details.
 */
type CLIArgs = {
  id: string;
};

const services = [
  "storage",
  "counter",
  "pubsub",
  "user",
  "workspaces",
  "platform-services",
  "console",
  "applications",
  "search",
  "database",
  "webserver",
  "channels",
];

const command: yargs.CommandModule<unknown, CLIArgs> = {
  command: "company",
  describe:
    "command to export everything inside a company (publicly data only available to a new member)",
  builder: {
    id: {
      default: "",
      type: "string",
      description: "Company ID",
    },
    output: {
      default: "",
      type: "string",
      description: "Folder containing the exported data",
    },
  },
  handler: async argv => {
    const platform = await twake.run(services);
    const userService = platform.getProvider<UserServiceAPI>("user");

    const company = await userService.companies.getCompany({ id: argv.id });

    if (!company) {
      return "No such company";
    }

    const output = (argv.output as string) || `export-${company.id}`;
    mkdirSync(output);

    //Company
    writeFileSync(`${output}/company.json`, JSON.stringify(userService.formatCompany(company)));

    //Workspaces
    const workspaceService = platform.getProvider<WorkspaceServiceAPI>("workspaces");
    const workspaces = await workspaceService.getAllForCompany(company.id);
    writeFileSync(`${output}/workspaces.json`, JSON.stringify(workspaces));

    //Users
    let users = [];
    for (const workspace of workspaces) {
      let workspaceUsers: WorkspaceUser[] = [];
      let pagination = new Pagination();
      while (pagination.page_token) {
        const res = await workspaceService.getUsers({ workspaceId: workspace.id }, pagination);
        workspaceUsers = [...workspaceUsers, ...res.getEntities()];
        pagination = res.nextPage as Pagination;
      }
      for (const workspaceUser of workspaceUsers) {
        const user = await userService.users.get({ id: workspaceUser.id });
        users.push({
          ...workspaceUser,
          user: userService.formatUser(user),
        });
      }
    }
    writeFileSync(`${output}/users.json`, JSON.stringify(users));

    //Applications
    const applicationService = platform.getProvider<ApplicationServiceAPI>("applications");
    const applications = await applicationService.companyApplications.list(
      new Pagination(),
      {},
      { company: { id: company.id }, user: { id: "", server_request: true } },
    );
    writeFileSync(`${output}/applications.json`, JSON.stringify(applications));

    //Channels
    let publicChannels: Channel[] = [];
    let directChannels: Channel[] = [];
    const channelService = platform.getProvider<ChannelServiceAPI>("channels");
    for (const workspace of workspaces) {
      let pagination = new Pagination();
      while (pagination.page_token) {
        const page = await channelService.channels.getDirectChannelsInCompany(
          pagination,
          company.id,
        );
        directChannels = [...directChannels, ...page.getEntities()] as Channel[];
        pagination = page.nextPage as Pagination;
      }

      pagination = new Pagination();
      while (pagination.page_token) {
        const page = await channelService.channels.list(
          pagination,
          {},
          {
            user: { id: "", server_request: true },
            workspace: { workspace_id: workspace.id, company_id: company.id },
          },
        );
        publicChannels = [
          ...publicChannels,
          ...page.getEntities().filter(c => c.visibility == ChannelVisibility.PUBLIC),
        ];
        pagination = page.nextPage as Pagination;
      }
    }
    writeFileSync(`${output}/direct_channels.json`, JSON.stringify(directChannels));
    writeFileSync(`${output}/public_channels.json`, JSON.stringify(publicChannels));

    //Messages
    mkdirSync(`${output}/messages`);
    const messageService = platform.getProvider<MessageServiceAPI>("messages");
    for (const channel of [...publicChannels, ...directChannels]) {
      let threads: MessageWithReplies[] = [];
      let messages: Message[] = [];
      let pagination = new Pagination();
      while (pagination.page_token) {
        const page = await messageService.views.listChannel(
          pagination,
          {
            include_users: false,
            replies_per_thread: 10000,
            emojis: false,
          },
          {
            user: { id: "", server_request: true },
            channel: {
              company_id: channel.company_id,
              workspace_id: channel.workspace_id,
              id: channel.id,
            },
          },
        );

        for (const thread of page.getEntities()) {
          messages = [...messages, ...thread.last_replies];
        }

        threads = [
          ...threads,
          ...page.getEntities().map(thread => {
            thread.last_replies = undefined;
            return thread;
          }),
        ];

        pagination = page.nextPage as Pagination;
      }
      writeFileSync(`${output}/messages/${channel.id}-threads.json`, JSON.stringify(threads));
      writeFileSync(`${output}/messages/${channel.id}.json`, JSON.stringify(messages));
    }

    await platform.stop();
  },
};

export default command;
