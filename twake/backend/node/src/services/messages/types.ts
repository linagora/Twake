import { ExecutionContext } from "../../core/platform/framework/api/crud-service";
import { uuid } from "../../utils/types";
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

  sender_name?: string;
  channel_name?: string;
  company_name?: string;
  workspace_name?: string;

  title: string;
  text: string;
};

export type MessageWithReplies = Message & {
  last_replies: Message[];
  stats: {
    last_activity: number;
    replies: number;
  };
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

export interface PinOperation {
  id: string;
  pin: boolean;
}

export interface ReactionOperation {
  id: string;
  reactions: string[];
}

export interface BookmarkOperation {
  id: string;
  bookmark_id: string;
  active: boolean;
}

export interface MessagesSaveOptions {
  threadInitialMessage?: boolean;
  enforceViewPropagation?: boolean;
  message_moved?: boolean;
  previous_thread?: string; //If message was in a previous thread before (moved) then this indicate when is it from
}
export interface MessagesGetThreadOptions {
  replies_per_thread?: number;
}
