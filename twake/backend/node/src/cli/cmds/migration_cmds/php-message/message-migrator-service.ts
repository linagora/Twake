import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { PhpMessagesService } from "./php-message-service";
import UserServiceAPI from "../../../../services/user/api";
import ChannelServiceAPI from "../../../../services/channels/provider";
import { convertUuidV4ToV1 } from "./utils";
import Company from "../../../../services/user/entities/company";
import { Pagination } from "../../../../core/platform/framework/api/crud-service";
import { PhpMessage } from "./php-message-entity";
import { TwakePlatform } from "../../../../core/platform/platform";
import { MessageServiceAPI } from "../../../../services/messages/api";
import {
  Message,
  MessageEdited,
  MessageOverride,
  MessagePinnedInfo,
  MessageReaction,
} from "../../../../services/messages/entities/messages";
import { ParticipantObject, Thread } from "../../../../services/messages/entities/threads";
import { Block } from "../../../../services/messages/blocks-types";

type MigratedChannel = {
  id: string;
  workspace_id: string;
  company_id: string;
  owner?: string;
};

class MessageMigrator {
  private database: DatabaseServiceAPI;
  private userService: UserServiceAPI;
  private channelService: ChannelServiceAPI;
  private phpMessageService: PhpMessagesService;
  private nodeMessageService: MessageServiceAPI;

  constructor(readonly platform: TwakePlatform) {
    this.database = this.platform.getProvider<DatabaseServiceAPI>("database");
    this.userService = this.platform.getProvider<UserServiceAPI>("user");
    this.channelService = this.platform.getProvider<ChannelServiceAPI>("channels");
    this.phpMessageService = new PhpMessagesService(this.database);
    this.nodeMessageService = this.platform.getProvider<MessageServiceAPI>("messages");
  }

  public async run(): Promise<void> {
    await this.phpMessageService.init();

    // Get all companies
    let page: Pagination = { limitStr: "100" };
    // For each companies find workspaces
    do {
      const companyListResult = await this.userService.companies.getCompanies(page);
      page = companyListResult.nextPage as Pagination;

      for (const company of companyListResult.getEntities()) {
        await this.migrateCompanyDirectMessages(company);

        await this.migrateCompanyChannelsMessages(company);
        console.log(`${company.id} - completed  ✅`);
      }
    } while (page.page_token);

    console.log("Php Messages successfully migrated to node !");
  }

  /**
   *  Set all direct messages in company and set them to channelPhpMessages
   */
  private async migrateCompanyDirectMessages(company: Company) {
    let pageDirectChannels: Pagination = { limitStr: "100" };
    // For each directChannels find messages
    do {
      const directChannelsInCompanyResult = await this.channelService.channels.list(
        pageDirectChannels,
        {},
        {
          workspace: {
            workspace_id: "direct",
            company_id: company.id,
          },
          user: { id: null, server_request: true },
        },
      );

      pageDirectChannels = directChannelsInCompanyResult.nextPage as Pagination;

      for (const directChannel of directChannelsInCompanyResult.getEntities()) {
        await this.migrateChannelsMessages(company, {
          id: directChannel.id,
          workspace_id: "direct",
          company_id: directChannel.company_id,
        });
      }
    } while (pageDirectChannels.page_token);
  }

  /**
   * Set all messages in company and set them to channelPhpMessages
   */
  private async migrateCompanyChannelsMessages(company: Company) {
    // Get all workspaces in company
    const workspacesInCompany = (
      await this.userService.workspaces.getWorkspaces({ limitStr: "" }, { company_id: company.id })
    ).getEntities();

    // For each workspaces find channels
    for (const workspace of workspacesInCompany) {
      // Get all channels in workspace
      let pageChannels: Pagination = { limitStr: "1" };
      do {
        const channelsInWorkspace = await this.channelService.channels.list(
          pageChannels,
          {},
          {
            workspace: {
              workspace_id: workspace.id,
              company_id: workspace.group_id,
            },
            user: { id: null, server_request: true },
          },
        );
        pageChannels = channelsInWorkspace.nextPage as Pagination;

        // For each channels find messages
        for (const channel of channelsInWorkspace.getEntities()) {
          await this.migrateChannelsMessages(company, {
            id: channel.id,
            workspace_id: channel.workspace_id,
            company_id: channel.company_id,
            owner: channel.owner,
          });
        }
      } while (pageChannels.page_token);
    }
  }

  //Params: company, channel
  private async migrateChannelsMessages(company: Company, channel: MigratedChannel) {
    //This function will migrate all messages in a channel
    let pagePhpMessages: Pagination = { limitStr: "100" };
    do {
      const messages = await this.phpMessageService.list(
        pagePhpMessages,
        {},
        {
          channel_id: convertUuidV4ToV1(channel.id),
          user: { id: null, server_request: true },
        },
      );

      for (const message of messages.getEntities()) {
        await this.migrateMessage(company, channel, message);
      }

      pagePhpMessages = messages.nextPage as Pagination;
    } while (pagePhpMessages.page_token);
  }

  private migratedThreads: string[] = [];

  /**
   *  Migrate php message to node
   * @param company
   * @param channel
   * @param message
   */
  private async migrateMessage(company: Company, channel: MigratedChannel, message: PhpMessage) {
    if (message.id) {
      //Create thread first if not exists
      const threadId = message.parent_message_id || message.id;
      const threadDoesNotExists = !this.migratedThreads.includes(threadId);
      if (threadDoesNotExists) {
        await this.migratePhpMessageToNodeThread(message, channel, company);
        this.migratedThreads.push(threadId);
        console.log(this.migratedThreads + "");
      }

      //Migrate message itself
      await this.migratePhpMessageToNodeMessage(threadId, message, company);
    }
  }

  /**
   * Migrate php message to node thread
   * @param message PhpMessage
   * @param channel MigratedChannel
   */
  private async migratePhpMessageToNodeThread(
    message: PhpMessage,
    channel: MigratedChannel,
    company: Company,
  ) {
    const thread = new Thread();

    // Set nodeThread values
    thread.id = message.id;
    thread.created_at = message.creation_date;
    thread.last_activity = message.modification_date;
    thread.answers = message.responses_count;
    thread.participants = [
      {
        type: "channel",
        id: channel.id,
        company_id: channel.company_id,
        workspace_id: channel.workspace_id,
        created_at: message.creation_date,
        created_by: message.sender,
      } as ParticipantObject,
    ];

    // Create nodeThread
    return await this.nodeMessageService.threads.save(
      thread,
      {},
      { user: { id: null, server_request: true }, company },
    );
  }

  /**
   * Set message string type
   * @param integer 0 = null | 1 = system | 2 = application
   */
  private setMessageType(integer: number): { type: Message["type"]; subtype: Message["subtype"] } {
    switch (integer) {
      case 1:
        return {
          type: "message",
          subtype: "application",
        };
      case 2:
        return {
          type: "message",
          subtype: "system",
        };
      case 0:
      default:
        return {
          type: "message",
          subtype: null,
        };
    }
  }

  /**
   * Set blocks array
   * @param content { [key: string]: any }
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private setBlocks(content: { [key: string]: any }): Block[] {
    const blocks: Block[] = [];

    if (!content) return blocks;

    const new_block_format: Block = {
      type: "twacode",
      elements: content.formatted || content.prepared || [],
    };

    blocks.push(new_block_format);

    return blocks;
  }

  /**
   * Set edited message Object
   * @param modification_date timestamp
   */
  private setMessageEditedObject(modification_date: number): MessageEdited {
    return modification_date ? { edited_at: modification_date } : null;
  }

  /**
   * Set pinned message Object
   * @param message PhpMessage
   */
  private setMessagePinnedObject(message: PhpMessage): MessagePinnedInfo {
    return { pinned_at: 0, pinned_by: message.sender };
  }

  /**
   * Set reactions message object
   * @param reactions JSON
   */
  private setMessageReactionsObject(reactions: string): MessageReaction[] {
    const parsed_reactions = JSON.parse(reactions);

    if (!parsed_reactions) return [];

    const new_reactions_array: MessageReaction[] = [];

    for (const reaction_name in parsed_reactions) {
      const new_reaction_object: MessageReaction = {
        name: reaction_name,
        users: parsed_reactions[reaction_name].users,
        count: parsed_reactions[reaction_name].count,
      };

      new_reactions_array.push(new_reaction_object);
    }

    return new_reactions_array;
  }

  /**
   * Set override message Object
   * @param message PhpMessage
   */
  private setMessageOverrideObject(message: PhpMessage): MessageOverride {
    return null;
  }

  /**
   * Migrate php message to node message
   * @param message PhpMessage
   */
  private async migratePhpMessageToNodeMessage(
    threadId: string,
    message: PhpMessage,
    company: Company,
  ) {
    const nodeMessage = new Message();

    // Set nodeMessage values
    nodeMessage.id = message.id;
    nodeMessage.thread_id = threadId;
    nodeMessage.type = this.setMessageType(message.message_type).type;
    nodeMessage.subtype = this.setMessageType(message.message_type).subtype;
    nodeMessage.created_at = message.creation_date * 1000;
    nodeMessage.user_id = message.sender;
    nodeMessage.application_id = message.application_id;
    nodeMessage.text = message.content?.original_str || "";
    nodeMessage.blocks = this.setBlocks(message.content);
    nodeMessage.context = message.hidden_data;
    nodeMessage.edited = this.setMessageEditedObject(message.modification_date);
    nodeMessage.pinned_info = this.setMessagePinnedObject(message);
    nodeMessage.reactions = this.setMessageReactionsObject(message.reactions);
    nodeMessage.override = this.setMessageOverrideObject(message);

    // Create nodeMessage then add it to thread
    return await this.nodeMessageService.messages.save(
      nodeMessage,
      {},
      {
        user: { id: null, server_request: true },
        thread: { id: threadId },
        company: { id: company.id },
      },
    );
  }
}

export default MessageMigrator;
