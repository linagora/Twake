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
import { CompanyExecutionContext, ThreadExecutionContext } from "./types";
import { ParticipantObject, Thread, ThreadPrimaryKey } from "./entities/threads";
import { Message, MessagePrimaryKey } from "./entities/messages";

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
  save(
    item: Pick<Thread, "company_id" | "id"> & {
      participants: Pick<ParticipantObject, "id" | "type">[];
    },
    options?: { participants?: any; message?: Message },
    context?: CompanyExecutionContext,
  ): Promise<SaveResult<Thread>>;

  checkAccessToThread(context: ThreadExecutionContext): Promise<boolean>;
}

export interface MessageThreadMessagesServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<Message, MessagePrimaryKey, ExecutionContext> {}

export interface MessageViewsServiceAPI extends TwakeServiceProvider, Initializable {}
