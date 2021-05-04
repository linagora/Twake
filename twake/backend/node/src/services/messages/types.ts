import { ExecutionContext } from "../../core/platform/framework/api/crud-service";
import { uuid } from "../types";
import { MessageFileMetadata } from "./entities/message-files";
import { Message } from "./entities/messages";
import { Thread } from "./entities/threads";

export type specialMention = "all" | "here" | "everyone" | "channel";

export type MessageNotification = {
  company_id: uuid;
  workspace_id: uuid | "direct";
  channel_id: uuid;
  thread_id: uuid;
  id: uuid;
  sender: uuid;
  creation_date: number;
  mentions?: {
    users?: uuid[];
    teams?: uuid[];
    specials?: specialMention[];
  };

  //Temp fix, should not be used like this by node except for push notification
  title: string;
  text: string;
};

export type ThreadWithLastMessages = Thread & {
  first_message: Message;
  last_replies: Message[];
};

export interface CompanyExecutionContext extends ExecutionContext {
  company: { id: string };
}

export interface ThreadExecutionContext extends ExecutionContext {
  thread: { id: string };
  company: { id: string };
}
export interface ChannelViewExecutionContext extends ExecutionContext {
  channel: {
    company_id: string;
    workspace_id: string;
    id: string;
  };
}
export interface MessageLocalEvent {
  resource: Message;
  context: ThreadExecutionContext;
  created: boolean;
}

export interface PaginationQueryParameters {
  page_token?: string;
  limit?: string;
  websockets?: boolean;
  direction?: "history" | "future";
}
export interface MessageViewListOptions {
  replies_per_thread: number;
  emojis: boolean;
}

export interface MessageListQueryParameters extends PaginationQueryParameters {}
