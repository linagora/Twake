import { PhpMessagesService } from "./php-message-service";
import { convertUuidV4ToV1 } from "./utils";
import Company from "../../../../services/user/entities/company";
import { Pagination } from "../../../../core/platform/framework/api/crud-service";
import { PhpMessage } from "./php-message-entity";
import { TwakePlatform } from "../../../../core/platform/platform";
import {
  Message,
  MessageEdited,
  MessageOverride,
  MessagePinnedInfo,
  MessageReaction,
} from "../../../../services/messages/entities/messages";
import { MessageChannelRef } from "../../../../services/messages/entities/message-channel-refs";
import { ParticipantObject, Thread } from "../../../../services/messages/entities/threads";
import { Block } from "../../../../services/messages/blocks-types";
import { WorkspaceExecutionContext } from "../../../../services/workspaces/types";
import gr from "../../../../services/global-resolver";

type MigratedChannel = {
  id: string;
  workspace_id: string;
  company_id: string;
  owner?: string;
};

type Options = {
  from?: string;
  onlyCompany?: string;
  onlyWorkspace?: string;
  onlyChannel?: string;
  ignoreExisting?: boolean;
  backToPhp?: boolean;
  dryRun?: boolean;
};
class MessageMigrator {
  private phpMessageService: PhpMessagesService;
  private migratedMessages = 0;
  private options: Options = {};

  constructor(readonly platform: TwakePlatform) {
    this.phpMessageService = new PhpMessagesService();
  }

  public async run(options: Options = {}): Promise<void> {
    await gr.doInit(this.platform);
    this.options = options;

    await this.phpMessageService.init();

    if (this.options.onlyCompany) {
      const company = await gr.services.companies.getCompany({ id: options.onlyCompany });
      await this.migrateCompanyMessages(company);
    } else {
      let waitForCompany = false;
      if (this.options.from) {
        waitForCompany = true;
      }

      // Get all companies
      let page: Pagination = { limitStr: "100" };
      // For each companies find workspaces
      do {
        const companyListResult = await gr.services.companies.getCompanies(page);
        page = companyListResult.nextPage as Pagination;

        for (const company of companyListResult.getEntities()) {
          if (waitForCompany && this.options.from == `${company.id}`) {
            waitForCompany = false;
          }

          if (!waitForCompany) {
            await this.migrateCompanyMessages(company);
          }
        }
      } while (page.page_token);
    }

    console.log(
      `Php Messages successfully migrated to node: (${this.migratedMessages} messages) !`,
    );
  }

  private async migrateCompanyMessages(company: Company) {
    console.log(`Start migration for ${company.id}...`);

    if (!this.options.onlyWorkspace || this.options.onlyWorkspace === "direct") {
      await this.migrateCompanyDirectMessages(company);
      console.log(
        `${company.id} - (1/2) migrated direct messages (total: ${this.migratedMessages} messages)  ✅`,
      );
    }

    if (!this.options.onlyWorkspace || this.options.onlyWorkspace !== "direct") {
      await this.migrateCompanyChannelsMessages(company);
      console.log(`${company.id} - (2/2) completed (total: ${this.migratedMessages} messages)  ✅`);
    }
  }

  /**
   *  Set all direct messages in company and set them to channelPhpMessages
   */
  private async migrateCompanyDirectMessages(company: Company) {
    await gr.doInit(this.platform);
    let pageDirectChannels: Pagination = { limitStr: "100" };
    // For each directChannels find messages
    do {
      const directChannelsInCompanyResult = await gr.services.channels.channels.list(
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
    await gr.doInit(this.platform);

    // Get all workspaces in company
    const workspacesInCompany = (
      await gr.services.workspaces.list({ limitStr: "" }, {}, {
        user: {
          id: null,
          server_request: true,
        },
        company_id: company.id,
      } as WorkspaceExecutionContext)
    ).getEntities();

    // For each workspaces find channels
    for (const workspace of workspacesInCompany) {
      if (this.options.onlyWorkspace && `${workspace.id}` !== this.options.onlyWorkspace) {
        continue;
      }

      // Get all channels in workspace
      let pageChannels: Pagination = { limitStr: "1" };
      do {
        const channelsInWorkspace = await gr.services.channels.channels.list(
          pageChannels,
          {},
          {
            workspace: {
              workspace_id: workspace.id,
              company_id: workspace.company_id,
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
    if (this.options.onlyChannel && `${channel.id}` !== this.options.onlyChannel) {
      return;
    }

    if (this.options.backToPhp) {
      await this.migrateChannelsMessagesBackToPhp(company, channel);
      return;
    }

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
        try {
          await this.migrateMessage(company, channel, message);
        } catch (err) {
          console.log(err);
        }
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
    if (!message.id) {
      return;
    }
    await gr.doInit(this.platform);
    //Create thread first if not exists
    const threadId = message.parent_message_id || message.id;

    if (this.options.ignoreExisting) {
      const msg = await gr.services.messages.messages.get({
        thread_id: threadId,
        id: message.id,
      });
      if (msg) {
        return;
      }
    }

    const threadDoesNotExists = !this.migratedThreads.includes(threadId);
    if (threadDoesNotExists) {
      await this.migratePhpMessageToNodeThread(message, channel, company);
      this.migratedThreads.push(threadId);
    }

    //Migrate message itself
    await this.migratePhpMessageToNodeMessage(threadId, message, company);

    this.migratedMessages++;

    if (this.migratedMessages % 100 == 0) {
      console.log(`${company.id} - ... (total: ${this.migratedMessages} messages)`);
    }

    //Force delay between channels
    await new Promise(r => {
      setTimeout(r, 40);
    });
  }

  private async migrateChannelsMessagesBackToPhp(company: Company, channel: MigratedChannel) {
    await gr.doInit(this.platform);
    const channelRefRepository = await gr.database.getRepository(
      "message_channel_refs",
      MessageChannelRef,
    );
    const messageRepository = await gr.database.getRepository("messages", Message);

    //This function will migrate all messages in a channel
    let pageMessages: Pagination = { limitStr: "100" };
    do {
      const messages = await channelRefRepository.find(
        {
          company_id: company.id,
          workspace_id: channel.workspace_id,
          channel_id: channel.id,
        },
        { pagination: pageMessages },
        undefined,
      );

      for (const messageRef of messages.getEntities()) {
        const messages = await messageRepository.find(
          {
            thread_id: messageRef.thread_id,
          },
          {},
          undefined,
        );

        for (const message of messages.getEntities()) {
          const uuidv1_channel_id =
            channel.id.substring(0, 14) + "1" + channel.id.substring(14 + 1);

          let phpMessage = await this.phpMessageService.get({
            id: message.id,
          });

          if (!phpMessage) {
            phpMessage = await this.phpMessageService.get({
              channel_id: uuidv1_channel_id,
              parent_message_id: message.thread_id,
              id: message.id,
            });
          }

          if (!phpMessage && message.subtype !== "deleted") {
            //This message doesn't exists in php, move it to php

            const newPhpMessage = new PhpMessage();
            newPhpMessage.id = message.id;
            newPhpMessage.channel_id = uuidv1_channel_id;
            newPhpMessage.parent_message_id = message.thread_id;
            newPhpMessage.application_id = message.application_id || null;
            newPhpMessage.modification_date = Math.floor(
              message.edited?.edited_at || message.created_at,
            );
            newPhpMessage.creation_date = Math.floor(message.created_at);
            newPhpMessage.sender = message.user_id;
            newPhpMessage.pinned = !!message.pinned_info?.pinned_at;
            newPhpMessage.edited = !!message.edited?.edited_at;
            newPhpMessage.message_type =
              message.subtype === "application" ? 1 : message.subtype === "system" ? 2 : 0;
            newPhpMessage.hidden_data = message.context;
            newPhpMessage.reactions = "{}";
            newPhpMessage.responses_count = 0;

            let prepared: any[] = [];
            (message.blocks || []).map(block => {
              if (block.type === "twacode") {
                prepared = block["elements"];
              }
              if (block.type === "section" && prepared.length > 0) {
                prepared = [
                  {
                    type: "twacode",
                    content: block?.text?.text || "",
                  },
                ];
              }
            });
            newPhpMessage.content = {
              fallback_string: message.text,
              original_str: message.text,
              files: (message.files || []).map(f => {
                return {
                  content: f,
                  mode: "mini",
                  type: "file",
                };
              }),
              prepared: prepared,
            };

            if (!this.options.dryRun) {
              await this.phpMessageService.repository.save(newPhpMessage, undefined);
            }

            this.migratedMessages++;
            if (this.migratedMessages % 100 == 0) {
              console.log(`${company.id} - ... (total: ${this.migratedMessages} messages)`);
            }
          }
        }
      }

      pageMessages = messages.nextPage as Pagination;
    } while (pageMessages.page_token);
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
    thread.id = message.parent_message_id || message.id;
    thread.created_at = message.creation_date;
    thread.last_activity = message.modification_date;
    thread.answers = 0;
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

    if (this.options.dryRun) {
      return;
    }

    // Create nodeThread
    return await gr.services.messages.threads.save(
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
      elements: content.formatted || content.prepared || content || [],
    };

    blocks.push(new_block_format);

    return blocks;
  }

  /**
   * Set edited message Object
   * @param modification_date timestamp
   */
  private setMessageEditedObject(message: PhpMessage): MessageEdited {
    return message.edited ? { edited_at: message.modification_date } : null;
  }

  /**
   * Set pinned message Object
   * @param message PhpMessage
   */
  private setMessagePinnedObject(message: PhpMessage): MessagePinnedInfo {
    if (message.pinned) {
      return { pinned_at: 0, pinned_by: message.sender };
    }
    return null;
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
    nodeMessage.created_at = message.creation_date;
    nodeMessage.user_id = message.sender;
    nodeMessage.application_id = message.application_id;
    nodeMessage.text = message.content?.original_str || "";
    nodeMessage.blocks = this.setBlocks(message.content);
    nodeMessage.context = message.hidden_data || {};
    nodeMessage.edited = this.setMessageEditedObject(message);
    nodeMessage.pinned_info = this.setMessagePinnedObject(message);
    nodeMessage.reactions = this.setMessageReactionsObject(message.reactions);
    nodeMessage.override = this.setMessageOverrideObject(message);

    nodeMessage.context._front_id = message.id;

    if (this.options.dryRun) {
      return;
    }

    // Create nodeMessage then add it to thread
    return await gr.services.messages.messages.save(
      nodeMessage,
      {
        enforceViewPropagation: true,
      },
      {
        user: { id: null, server_request: true },
        thread: { id: threadId },
        company: { id: company.id },
      },
    );
  }
}

export default MessageMigrator;
