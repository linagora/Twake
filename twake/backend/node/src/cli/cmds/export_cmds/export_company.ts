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
import { Channel, ChannelMember } from "../../../services/channels/entities";
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
  "auth",
  "storage",
  "counter",
  "pubsub",
  "user",
  "files",
  "messages",
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

    console.log(`Start export for company ${company.id}`);

    const output = (argv.output as string) || `export-${company.id}`;
    mkdirSync(output);

    //Company
    console.log(`- Create company json file`);
    writeFileSync(`${output}/company.json`, JSON.stringify(userService.formatCompany(company)));

    //Workspaces
    console.log(`- Create workspaces json file`);
    const workspaces = await userService.workspaces.getAllForCompany(company.id);
    writeFileSync(`${output}/workspaces.json`, JSON.stringify(workspaces));

    //Users
    console.log(`- Create users json file`);
    let users = [];
    let workspace_users = [];
    for (const workspace of workspaces) {
      let workspaceUsers: WorkspaceUser[] = [];
      let pagination = new Pagination();
      do {
        const res = await userService.workspaces.getUsers(
          { workspaceId: workspace.id },
          pagination,
        );
        workspaceUsers = [...workspaceUsers, ...res.getEntities()];
        pagination = res.nextPage as Pagination;
      } while (pagination.page_token);
      for (const workspaceUser of workspaceUsers) {
        const user = await userService.users.get({ id: workspaceUser.userId });
        if (user) {
          users.push(await userService.formatUser(user));
          workspace_users.push(workspaceUser);
        }
      }
    }
    writeFileSync(`${output}/users.json`, JSON.stringify(users));
    writeFileSync(`${output}/workspace_users.json`, JSON.stringify(workspace_users));

    //Applications
    console.log(`- Create applications json file`);
    const applicationService = platform.getProvider<ApplicationServiceAPI>("applications");
    const applications = await applicationService.companyApplications.list(
      new Pagination(),
      {},
      { company: { id: company.id }, user: { id: "", server_request: true } },
    );
    writeFileSync(`${output}/applications.json`, JSON.stringify(applications));

    //Channels
    console.log(`- Create channels json file`);
    let publicChannels: Channel[] = [];
    let directChannels: Channel[] = [];
    const channelService = platform.getProvider<ChannelServiceAPI>("channels");
    for (const workspace of workspaces) {
      let pagination = new Pagination();
      do {
        const page = await channelService.channels.getDirectChannelsInCompany(
          pagination,
          company.id,
        );
        directChannels = [...directChannels, ...page.getEntities()] as Channel[];
        pagination = page.nextPage as Pagination;
      } while (pagination.page_token);

      pagination = new Pagination();
      do {
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
      } while (pagination.page_token);
    }
    writeFileSync(`${output}/direct_channels.json`, JSON.stringify(directChannels));
    writeFileSync(`${output}/public_channels.json`, JSON.stringify(publicChannels));

    //Channels users
    console.log(`- Create channels users json file`);
    mkdirSync(`${output}/channel_users`);
    for (const channel of [...publicChannels /*, ...directChannels*/]) {
      let members: ChannelMember[] = [];
      let pagination = new Pagination();
      do {
        const page = await channelService.members.list(
          pagination,
          {},
          {
            user: { id: "", server_request: true },
            channel: {
              company_id: channel.company_id,
              workspace_id: channel.workspace_id,
              id: channel.id,
            },
          },
        );
        members = [...members, ...page.getEntities()] as ChannelMember[];
        pagination = page.nextPage as Pagination;
      } while (pagination.page_token);
      writeFileSync(`${output}/channel_users/${channel.id}.json`, JSON.stringify(members));
    }

    //Messages
    console.log(`- Create messages json file`);
    mkdirSync(`${output}/messages`);
    const messageService = platform.getProvider<MessageServiceAPI>("messages");
    //Note: direct channels content is private and not needed for R&D
    for (const channel of [...publicChannels /*, ...directChannels*/]) {
      let threads: MessageWithReplies[] = [];
      let messages: Message[] = [];
      let pagination = new Pagination();
      try {
        do {
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
        } while (pagination.page_token);
      } catch (err) {
        console.log(`-- Error on the channel ${channel.id}`);
      }
      writeFileSync(`${output}/messages/${channel.id}-threads.json`, JSON.stringify(threads));
      writeFileSync(`${output}/messages/${channel.id}.json`, JSON.stringify(messages));
    }

    await platform.stop();
  },
};

export default command;
