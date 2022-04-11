import {
  SaveResult,
  OperationType,
  DeleteResult,
  ListResult,
  Pagination,
} from "../../../../core/platform/framework/api/crud-service";
import { ResourcePath } from "../../../../core/platform/services/realtime/types";
import { logger, RealtimeSaved, TwakeContext } from "../../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { MessageServiceAPI, MessageThreadMessagesServiceAPI } from "../../api";
import {
  getInstance,
  Message,
  MessageWithUsers,
  TYPE as MessageTableName,
} from "../../entities/messages";
import {
  getInstance as getMsgfileInstance,
  MessageFile,
  TYPE as MsgFileTableName,
} from "../../entities/message-files";
import {
  BookmarkOperation,
  MessageLocalEvent,
  MessagesGetThreadOptions,
  MessagesSaveOptions,
  MessageWithReplies,
  MessageWithRepliesWithUsers,
  PinOperation,
  ReactionOperation,
  ThreadExecutionContext,
} from "../../types";
import { getThreadMessagePath, getThreadMessageWebsocketRoom } from "../../web/realtime";
import { localEventBus } from "../../../../core/platform/framework/pubsub";
import { buildMessageListPagination, getMentions } from "../utils";
import _, { update } from "lodash";
import { ThreadMessagesOperationsService } from "./operations";
import { getDefaultMessageInstance } from "./utils";
import { Thread } from "../../entities/threads";
import UserServiceAPI from "../../../user/api";
import ChannelServiceAPI from "../../../channels/provider";
import { UserObject } from "../../../user/web/types";
import { FileServiceAPI } from "../../../files/api";
import { ApplicationServiceAPI } from "../../../applications/api";
import { PlatformServicesAPI } from "../../../../core/platform/services/platform-services";

export class ThreadMessagesService implements MessageThreadMessagesServiceAPI {
  version: "1";
  repository: Repository<Message>;
  msgFilesRepository: Repository<MessageFile>;
  operations: ThreadMessagesOperationsService;

  constructor(
    private platformServices: PlatformServicesAPI,
    private user: UserServiceAPI,
    private channel: ChannelServiceAPI,
    private files: FileServiceAPI,
    private applications: ApplicationServiceAPI,
    private service: MessageServiceAPI,
  ) {
    this.operations = new ThreadMessagesOperationsService(platformServices.database, service, this);
  }

  async init(context: TwakeContext): Promise<this> {
    this.repository = await this.platformServices.database.getRepository<Message>(
      MessageTableName,
      Message,
    );
    this.msgFilesRepository = await this.platformServices.database.getRepository<MessageFile>(
      MsgFileTableName,
      MessageFile,
    );
    await this.operations.init(context);
    return this;
  }

  /**
   * Save a message
   * The server / application / users can do different actions
   * @param item
   * @param options
   * @param context
   * @returns SaveResult<Message>
   */
  async save(
    item: Partial<Message>,
    options?: MessagesSaveOptions,
    context?: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    //This can come from:
    // - Server want to change the message somehow (the message should already be formated)
    // - Application change the message
    // - User change its message
    // - Pin / Reaction / Bookmark are *not* done here

    const serverRequest = context?.user?.server_request;
    const applicationRequest = context?.user?.application_id;
    let messageOwnerAndNotRemoved = true;

    item.thread_id = (serverRequest ? item.thread_id : null) || context.thread.id;
    const pk = _.pick(item, "thread_id", "id");

    let messageCreated = !pk.id;

    if (!pk.thread_id || (!serverRequest && !this.service.threads.checkAccessToThread(context))) {
      logger.error(`Unable to write in thread ${context.thread.id}`);
      throw Error("Can't write this message.");
    }

    let message = getDefaultMessageInstance(item, context);
    if (pk.id) {
      const existingMessage = await this.repository.findOne(pk);
      if (!existingMessage && !serverRequest) {
        logger.error(`This message ${item.id} doesn't exists in thread ${item.thread_id}`);
        throw Error("This message doesn't exists.");
      }
      if (existingMessage) {
        message = existingMessage;
        messageOwnerAndNotRemoved =
          ((context.user?.id && message.user_id === context.user?.id) ||
            (context.user?.application_id &&
              message.application_id === context.user?.application_id)) &&
          message.subtype !== "deleted";

        if (message.user_id === context.user?.id && context.user?.id) {
          message.edited = {
            edited_at: new Date().getTime(),
          };
        }
      } else {
        messageCreated = true;
      }
    }

    const updatable: { [K in keyof Partial<Message>]: boolean } = {
      ephemeral: serverRequest || messageOwnerAndNotRemoved,
      subtype: serverRequest,
      text: serverRequest || messageOwnerAndNotRemoved,
      blocks: serverRequest || messageOwnerAndNotRemoved,
      context: serverRequest || messageOwnerAndNotRemoved,
      override: serverRequest || (messageOwnerAndNotRemoved && !!applicationRequest),
    };
    Object.keys(updatable).forEach(k => {
      if ((updatable as any)[k] && (item as any)[k] !== undefined) {
        (message as any)[k] = (item as any)[k];
      }
    });
    message = _.assign(message, pk);

    if (context.workspace && context.channel) {
      message.cache = {
        company_id: context.company.id,
        workspace_id: context.workspace.id,
        channel_id: context.channel.id,
      };
    }

    if (!message.ephemeral) {
      if (options.threadInitialMessage) {
        message.id = message.thread_id;
      }

      logger.info(`Saved message in thread ${message.thread_id}`);
      await this.repository.save(message);
    } else {
      logger.info(`Did not save ephemeral message in thread ${message.thread_id}`);
    }

    if (serverRequest || messageOwnerAndNotRemoved) {
      message = await this.completeMessage(message, { files: item.files || message.files || [] });
    }

    await this.onSaved(message, { created: messageCreated }, context);

    return new SaveResult<Message>(
      "message",
      message,
      messageCreated ? OperationType.CREATE : OperationType.UPDATE,
    );
  }

  /**
   * Move a message from a thread to another
   * @param item
   * @param options
   * @param context
   * @returns
   */
  async move(
    pk: Pick<Message, "id">,
    options: { previous_thread: string },
    context: ThreadExecutionContext,
  ): Promise<void> {
    logger.debug(
      `Try to move message ${pk.id} from thread ${options.previous_thread} to thread ${context.thread.id}`,
    );

    if (options.previous_thread === context.thread.id) {
      return;
    }

    //Move replies if it was a thread head message
    if (pk.id === options.previous_thread) {
      let nextPage: Pagination = { limitStr: "100" };
      do {
        const replies = await this.list(
          nextPage,
          {},
          {
            user: { id: null, server_request: true },
            thread: { id: pk.id },
            company: { id: context.company.id },
          },
        );

        for (const reply of replies.getEntities()) {
          //Do not create an infinite loop
          if (reply.id !== options.previous_thread) {
            logger.debug(
              `Try to move reply ${reply.id} to message ${pk.id} from thread ${reply.thread_id} to thread ${context.thread.id}`,
            );

            await this.service.messages.move(
              { id: reply.id || undefined },
              {
                previous_thread: reply.thread_id,
              },
              context,
            );
          }
        }

        nextPage = replies.nextPage as Pagination;
      } while (nextPage.page_token);
    }

    const messageInOldThread = await this.repository.findOne({
      thread_id: options.previous_thread,
      id: pk.id,
    });

    if (!messageInOldThread) {
      logger.error(`Unable to find message ${pk.id} in old thread ${context.thread.id}`);
      throw Error("Can't move this message.");
    }

    //Check new thread exists
    let thread = await this.service.threads.get({ id: context.thread.id });
    if (!thread && `${context.thread.id}` === `${pk.id}`) {
      logger.info("Create empty thread for message moved out of thread");
      const oldThread = await this.service.threads.get({ id: options.previous_thread });
      const upgradedContext = _.cloneDeep(context);
      upgradedContext.user.server_request = true;
      thread = (
        await this.service.threads.save(
          {
            id: messageInOldThread.id,
            participants: oldThread.participants,
          },
          {},
          upgradedContext,
        )
      )?.entity;
    }
    if (!thread) {
      throw Error("Can't move this message to inexistent thread.");
    }

    const messageInNewThread = _.cloneDeep(messageInOldThread);
    messageInNewThread.thread_id = context.thread.id;

    await this.repository.save(messageInNewThread);

    await this.onSaved(messageInNewThread, { created: true }, context);

    await this.repository.remove(messageInOldThread);
    await this.service.threads.addReply(messageInOldThread.thread_id, -1);

    logger.info(
      `Moved message ${pk.id} from thread ${options.previous_thread} to thread ${context.thread.id}`,
    );

    return;
  }

  async forceDelete(pk: Message, context?: ThreadExecutionContext): Promise<DeleteResult<Message>> {
    return this.delete(pk, context, true);
  }

  async delete(
    pk: Message,
    context?: ThreadExecutionContext,
    forceDelete: boolean = false,
  ): Promise<DeleteResult<Message>> {
    if (!context?.user?.server_request && !this.service.threads.checkAccessToThread(context)) {
      logger.error(`Unable to write in thread ${context.thread.id}`);
      throw Error("Can't edit this message.");
    }

    const message = await this.repository.findOne({
      thread_id: context.thread.id,
      id: pk.id,
    });

    if (!message) {
      logger.error(
        "This message does not exists, only remove it on websockets (ephemeral message)",
      );

      const msg = getInstance({
        subtype: "deleted",
        ...pk,
      });

      msg.ephemeral = pk.ephemeral || {
        id: pk.id,
        version: "",
        recipient: "",
        recipient_context_id: "",
      };

      await this.onSaved(msg, { created: false }, context);

      return new DeleteResult<Message>("message", msg, true);
    }

    if (
      !context?.user?.server_request &&
      message.user_id !== context.user.id &&
      message.application_id !== context?.user?.application_id
    ) {
      logger.error("You have no right to delete this message");
      throw Error("Can't delete this message.");
    }

    message.subtype = "deleted";
    message.blocks = [];
    message.reactions = [];
    message.text = "Deleted message";
    message.files = [];

    logger.info(`Deleted message ${pk.id} from thread ${message.thread_id}`);
    await this.repository.save(message);
    await this.onSaved(message, { created: false }, context);

    //Only server and application can definively remove a message
    if (
      (forceDelete && (context.user.server_request || context.user.application_id)) ||
      message.application_id
    ) {
      await this.repository.remove(message);
    }

    return new DeleteResult<Message>("message", message, true);
  }

  async getSingleMessage(pk: Pick<Message, "thread_id" | "id">) {
    let message = await this.repository.findOne(pk);
    if (message) {
      message = await this.completeMessage(message, { files: message.files || [] });
    }
    return message;
  }

  async get(
    pk: Pick<Message, "thread_id" | "id">,
    context?: ThreadExecutionContext,
  ): Promise<Message> {
    const thread = await this.service.threads.get({ id: pk.id }, context);
    if (thread) {
      return await this.getThread(thread);
    } else {
      return await this.getSingleMessage(pk);
    }
  }

  async getThread(
    thread: Thread,
    options: MessagesGetThreadOptions = {},
  ): Promise<MessageWithReplies> {
    const lastRepliesUncompleted = (
      await this.repository.find(
        {
          thread_id: thread.id,
        },
        {
          pagination: new Pagination("", `${options?.replies_per_thread || 3}`, false),
        },
      )
    ).getEntities();

    const lastReplies: Message[] = [];
    for (const lastReply of lastRepliesUncompleted) {
      if (lastReply)
        lastReplies.push(await this.completeMessage(lastReply, { files: lastReply.files || [] }));
    }

    const firstMessage = await this.getSingleMessage({
      thread_id: thread.id,
      id: thread.id,
    });

    return {
      ...firstMessage,
      stats: {
        replies: lastReplies.length === 1 ? 1 : thread.answers, //This line ensure the thread can be deleted by user if there is no replies
        last_activity: thread.last_activity,
      },
      last_replies: lastReplies.sort((a, b) => a.created_at - b.created_at),
    };
  }

  async list<ListOption>(
    pagination: Pagination,
    options?: ListOption,
    context?: ThreadExecutionContext,
  ): Promise<ListResult<Message>> {
    const list = await this.repository.find(
      { thread_id: context.thread.id },
      buildMessageListPagination(pagination, "id"),
    );

    //Get complete details about initial message
    if (
      list
        .getEntities()
        .map(m => `${m.id}`)
        .includes(`${context.thread.id}`)
    ) {
      const initialMessage = await this.get(
        { thread_id: context.thread.id, id: context.thread.id },
        context,
      );
      list.mapEntities((m: any) => {
        if (`${m.id}` === `${initialMessage.id}`) {
          return initialMessage;
        }
        return m;
      });
    }

    return list;
  }

  async includeUsersInMessage(message: Message): Promise<MessageWithUsers> {
    let ids: string[] = [];
    if (message.user_id) ids.push(message.user_id);
    if (message.pinned_info?.pinned_by) ids.push(message.pinned_info?.pinned_by);
    const mentions = await getMentions(message, async (username: string) => {
      return await this.user.users.getByUsername(username);
    });
    for (const mentionedUser of mentions.users) {
      ids.push(mentionedUser);
    }
    ids = _.uniq(ids);

    const users: UserObject[] = [];
    for (const id of ids) {
      users.push(await this.user.formatUser(await this.user.users.getCached({ id })));
    }

    let application = null;
    if (message.application_id) {
      application = await this.applications.applications.get({ id: message.application_id });
    }

    const messageWithUsers = { ...message, users, application };
    return messageWithUsers;
  }

  async includeUsersInMessageWithReplies(
    message: MessageWithReplies,
  ): Promise<MessageWithRepliesWithUsers> {
    let last_replies;
    for (const reply of message.last_replies || []) {
      if (!last_replies) last_replies = [];
      last_replies.push(await this.includeUsersInMessage(reply));
    }

    let highlighted_replies;
    for (const reply of message.highlighted_replies || []) {
      if (!highlighted_replies) highlighted_replies = [];
      highlighted_replies.push(await this.includeUsersInMessage(reply));
    }

    let thread;
    if (message.thread) {
      thread = await this.includeUsersInMessageWithReplies(message.thread);
    }

    const messageWithUsers = {
      ...message,
      users: (await this.includeUsersInMessage(message)).users,
      last_replies,
      highlighted_replies,
      thread,
    };

    return messageWithUsers;
  }

  @RealtimeSaved<Message>((message, context) => [
    {
      room: ResourcePath.get(getThreadMessageWebsocketRoom(context as ThreadExecutionContext)),
      path: getThreadMessagePath(context as ThreadExecutionContext) + "/" + message.id,
    },
  ])
  async onSaved(message: Message, options: { created?: boolean }, context: ThreadExecutionContext) {
    if (options.created && !message.ephemeral) {
      await this.service.threads.addReply(message.thread_id);
    }

    //Depreciated way of doing this was localEventBus.publish<MessageLocalEvent>("message:saved")
    await this.service.engine.dispatchMessage({
      resource: message,
      context: context,
      created: options.created,
    });

    return new SaveResult<Message>(
      "message",
      message,
      options.created ? OperationType.CREATE : OperationType.UPDATE,
    );
  }

  async pin(
    operation: PinOperation,
    options: Record<string, any>,
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    return this.operations.pin(operation, options, context);
  }

  async reaction(
    operation: ReactionOperation,
    options: Record<string, any>,
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    return this.operations.reaction(operation, options, context);
  }

  async bookmark(
    operation: BookmarkOperation,
    options: Record<string, any>,
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    return this.operations.bookmark(operation, options, context);
  }

  //Complete message with all missing information and cache
  async completeMessage(message: Message, options: { files?: Message["files"] } = {}) {
    this.fixReactionsFormat(message);
    try {
      if (options.files) message = await this.completeMessageFiles(message, options.files || []);
    } catch (err) {
      logger.warn("Error while completing message files", err);
    }

    //Mobile retro compatibility
    if ((message.blocks?.length || 0) === 0) {
      message.blocks = message.blocks || [];
      message.blocks.push({
        type: "twacode",
        elements: [message.text],
      });
    }

    return message;
  }

  //Fix https://github.com/linagora/Twake/issues/1559
  async fixReactionsFormat(message: Message) {
    if (message.reactions?.length > 0) {
      let foundError = false;
      message.reactions.map(r => {
        if (!(r.users?.length > 0)) {
          foundError = true;
          r.users = Object.values(r.users);
        }
      });
      if (foundError) await this.repository.save(message);
    }
  }

  async completeMessageFiles(message: Message, files: Message["files"]) {
    if (files.length === 0 && (message.files || []).length === 0) {
      return message;
    }

    let didChange = false;

    files = files.map(f => {
      f.message_id = message.id;
      return f;
    });

    const sameFile = (a: MessageFile["metadata"], b: MessageFile["metadata"]) => {
      return _.isEqual(a.external_id, b.external_id) && a.source === b.source;
    };

    //Delete all existing msg files not in the new files object
    const existingMsgFiles = (
      await this.msgFilesRepository.find({
        message_id: message.id,
      })
    ).getEntities();
    for (const entity of existingMsgFiles) {
      if (!files.some(f => sameFile(f.metadata, entity.metadata))) {
        await this.msgFilesRepository.remove(entity);
      }
    }

    //Ensure all files in the file object are in the message
    const previousMessageFiles = message.files;
    message.files = [];
    for (const file of files) {
      const existing = existingMsgFiles.filter(e => sameFile(e.metadata, file.metadata))[0];
      const entity = existing || new MessageFile();
      entity.message_id = message.id;
      entity.id = file.id || undefined;
      entity.company_id = file.company_id;

      //For internal files, we have a special additional sync
      if (file.metadata?.source == "internal") {
        //Test external id format
        if (
          message.files.length === 0 &&
          (typeof file.metadata.external_id === "string" ||
            !file.metadata.external_id?.company_id ||
            !file.metadata.external_id?.id)
        ) {
          console.log("File external_id format is wrong for source internal");
          continue;
        }

        const original = await this.files.get(file.metadata.external_id?.id as string, {
          user: { id: "", server_request: true },
          company: { id: file.metadata.external_id?.company_id as string },
        });
        if (original) {
          file.metadata = { ...file.metadata, ...original.metadata };
          file.metadata.thumbnails = (file.metadata.thumbnails || []).map((t, index) => {
            t.url = this.files.getThumbnailRoute(original, (t.index || index).toString());
            return t;
          });
        }
      }

      entity.metadata = file.metadata;

      if (!existing || !_.isEqual(existing.metadata, entity.metadata)) {
        didChange = true;

        await this.msgFilesRepository.save(entity);
      }

      message.files.push(entity);
    }

    if (!_.isEqual(previousMessageFiles.sort(), message.files.sort())) didChange = true;

    if (didChange) {
      await this.repository.save(message);
    }

    return message;
  }
}
