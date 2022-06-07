/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import {
  CRUDService,
  DeleteResult,
  ExecutionContext,
  ListResult,
  Paginable,
  Pagination,
  SaveResult,
} from "../../core/platform/framework/api/crud-service";
import { Initializable, TwakeServiceProvider } from "../../core/platform/framework/api";
import {
  UserMessageBookmark,
  UserMessageBookmarkPrimaryKey,
} from "./entities/user-message-bookmarks";

import {
  ChannelViewExecutionContext,
  CompanyExecutionContext,
  FlatFileFromMessage,
  FlatPinnedFromMessage,
  MessagesGetThreadOptions,
  MessageViewListOptions,
  MessageWithReplies,
  MessageWithRepliesWithUsers,
  SearchMessageOptions,
  ThreadExecutionContext,
} from "./types";

import { ParticipantObject, Thread, ThreadPrimaryKey } from "./entities/threads";
import { Message, MessagePrimaryKey, MessageWithUsers } from "./entities/messages";
import { uuid } from "../../utils/types";
import { PublicFile } from "../files/entities/file";

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
  addReply(thread_id: string, increment?: number): Promise<void>;
  setReplyCount(thread_id: string, count: number): Promise<void>;
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
    options: Record<string, any>,
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>>;

  reaction(
    item: { id: string; reactions: string[] },
    options: Record<string, any>,
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>>;

  save<SaveOptions>(
    item: Message,
    options?: SaveOptions,
    context?: ThreadExecutionContext,
  ): Promise<SaveResult<Message>>;

  bookmark(
    item: { id: string; bookmark_id: string; active: boolean },
    options: Record<string, any>,
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>>;

  download(
    item: { id: string; message_file_id: string; thread_id: string },
    options: Record<string, any>,
    context: ThreadExecutionContext,
  ): Promise<void>;

  forceDelete(
    pk: Pick<Message, "thread_id" | "id">,
    context?: ThreadExecutionContext,
  ): Promise<DeleteResult<Message>>;

  getThread(thread: Thread, options: MessagesGetThreadOptions): Promise<MessageWithReplies>;

  move(
    item: Pick<Message, "id">,
    options: { previous_thread: string },
    context: ThreadExecutionContext,
  ): Promise<void>;

  includeUsersInMessage(message: Message): Promise<MessageWithUsers>;
  includeUsersInMessageWithReplies(
    message: MessageWithReplies,
  ): Promise<MessageWithRepliesWithUsers>;

  inbox(
    userId: string,
    context: CompanyExecutionContext,
    pagination: Pagination,
  ): Promise<ListResult<Message>>;

  deleteLinkPreview(
    item: {
      message_id: string;
      thread_id: string;
      encoded_link: string;
    },
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>>;
}

export interface MessageViewsServiceAPI extends TwakeServiceProvider, Initializable {
  listChannel(
    pagination: Paginable,
    options?: MessageViewListOptions,
    context?: ChannelViewExecutionContext,
  ): Promise<ListResult<MessageWithReplies>>;

  listChannelFiles(
    pagination: Paginable,
    options?: MessageViewListOptions,
    context?: ChannelViewExecutionContext,
  ): Promise<ListResult<MessageWithReplies | FlatFileFromMessage>>;

  listChannelThreads(
    pagination: Paginable,
    options?: MessageViewListOptions,
    context?: ChannelViewExecutionContext,
  ): Promise<ListResult<MessageWithReplies>>;

  listChannelPinned(
    pagination: Paginable,
    options?: MessageViewListOptions,
    context?: ChannelViewExecutionContext,
  ): Promise<ListResult<MessageWithReplies | FlatPinnedFromMessage>>;

  search(
    pagination: Pagination,
    options: SearchMessageOptions,
    context?: ExecutionContext,
  ): Promise<ListResult<Message>>;

  listUserMarkedFiles(
    userId: string,
    type: "user_upload" | "user_download" | "both",
    media: "file_only" | "media_only" | "both",
    context: CompanyExecutionContext,
    pagination: Pagination,
  ): Promise<ListResult<PublicFile>>;
}
