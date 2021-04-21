import {
  CRUDService,
  ExecutionContext,
  ListResult,
} from "../../core/platform/framework/api/crud-service";
import { TwakeServiceProvider, Initializable } from "../../core/platform/framework/api";
import {
  UserMessageBookmark,
  UserMessageBookmarkPrimaryKey,
} from "./entities/user-message-bookmarks";
import { MessagesEngine } from "./services/engine";

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
    CRUDService<UserMessageBookmark, UserMessageBookmarkPrimaryKey, ExecutionContext> {}

export interface MessageThreadsServiceAPI extends TwakeServiceProvider, Initializable {}

export interface MessageThreadMessagesServiceAPI extends TwakeServiceProvider, Initializable {}

export interface MessageViewsServiceAPI extends TwakeServiceProvider, Initializable {}
