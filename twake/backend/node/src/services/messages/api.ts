/* eslint-disable @typescript-eslint/ban-types */

import {
  CRUDService,
  ExecutionContext,
  ListResult,
  Paginable,
  Pagination,
  SaveResult,
} from "../../core/platform/framework/api/crud-service";
import { TwakeServiceProvider, Initializable } from "../../core/platform/framework/api";
import {
  UserMessageBookmark,
  UserMessageBookmarkPrimaryKey,
} from "./entities/user-message-bookmarks";
import { MessagesEngine } from "./services/engine";

import {
  ChannelViewExecutionContext,
  CompanyExecutionContext,
  MessageViewListOptions,
  ThreadExecutionContext,
  MessageWithReplies,
} from "./types";

import { ParticipantObject, Thread, ThreadPrimaryKey } from "./entities/threads";
import { Message, MessagePrimaryKey } from "./entities/messages";
import {
  PhpMessage,
  PhpMessagePrimaryKey,
} from "../../cli/cmds/migration_cmds/php-message/php-message-entity";

export interface MessageServiceAPI extends TwakeServiceProvider, Initializable {
  userBookmarks: MessageUserBookmarksServiceAPI;
  threads: MessageThreadsServiceAPI;
  messages: MessageThreadMessagesServiceAPI;
  views: MessageViewsServiceAPI;
  engine: MessagesEngine;
}

export interface MessageUserBookmarksServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<UserMessageBookmark, UserMessageBookmarkPrimaryKey, ExecutionContext> {
  list<ListOptions>(
    pagination: Paginable,
    options?: ListOptions,
    context?: CompanyExecutionContext,
  ): Promise<ListResult<UserMessageBookmark>>;
}

export interface MessageThreadsServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<Thread, ThreadPrimaryKey, ExecutionContext> {
  addReply(thread_id: string): Promise<void>;
  save(
    item: Pick<Thread, "id"> & {
      participants: Pick<ParticipantObject, "id" | "type" | "workspace_id" | "company_id">[];
    },
    options?: { participants?: any; message?: Message },
    context?: CompanyExecutionContext,
  ): Promise<SaveResult<Thread>>;

  checkAccessToThread(context: ThreadExecutionContext): Promise<boolean>;
}

export interface MessageThreadMessagesServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<Message, MessagePrimaryKey, ExecutionContext> {
  pin(
    item: { id: string; pin: boolean },
    options: {},
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>>;

  reaction(
    item: { id: string; reactions: string[] },
    options: {},
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>>;

  save<SaveOptions>(
    item: Message,
    options?: SaveOptions,
    context?: ThreadExecutionContext,
  ): Promise<SaveResult<Message>>;

  bookmark(
    item: { id: string; bookmark_id: string; active: boolean },
    options: {},
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>>;
}

export interface PhpMessagesServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<PhpMessage, PhpMessagePrimaryKey, ExecutionContext> {}

export interface MessageViewsServiceAPI extends TwakeServiceProvider, Initializable {
  listChannel(
    pagination: Paginable,
    options?: MessageViewListOptions,
    context?: ChannelViewExecutionContext,
  ): Promise<ListResult<MessageWithReplies>>;
}
