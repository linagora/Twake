import { ExecutionContext } from "../../core/platform/framework/api/crud-service";
import { uuid } from "../../utils/types";
import { HookType } from "../applications-api/types";
import { Channel } from "../channels/entities";
import { UserObject } from "../user/web/types";
import { MessageFileRef } from "./entities/message-file-refs";
import { MessageFile } from "./entities/message-files";
import { Message, MessageWithUsers } from "./entities/messages";
import { Thread } from "./entities/threads";

export type SpecialMention = "all" | "here" | "everyone" | "channel";

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
    specials?: SpecialMention[];
  };

  sender_name?: string;
  channel_name?: string;
  company_name?: string;
  workspace_name?: string;

  title: string;
  text: string;
};

export type MessageHook = HookType & {
  channel: Channel;
  thread: Thread;
  message: Message;
};

export type MessageWithReplies = Message & {
  last_replies: Message[];
  thread?: MessageWithReplies;
  highlighted_replies?: Message[];
  stats: {
    last_activity: number;
    replies: number;
  };
};

export type MessageWithRepliesWithUsers = MessageWithReplies & {
  last_replies: MessageWithUsers[];
  thread?: MessageWithRepliesWithUsers;
  highlighted_replies?: MessageWithUsers[];
  users: UserObject[];
};

export interface CompanyExecutionContext extends ExecutionContext {
  company: { id: string };
}

export interface ThreadExecutionContext extends CompanyExecutionContext {
  thread: { id: string };
  company: { id: string };
  workspace?: { id: string };
  channel?: { id: string };
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
  include_users?: boolean;
  replies_per_thread?: number;
  flat?: boolean;
  emojis?: boolean;
  media_only?: boolean;
  file_only?: boolean;
}

export interface MessageListQueryParameters extends PaginationQueryParameters {
  include_users: boolean;
}

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

export type MessageFileDownloadEvent = {
  user: { id: string };
  operation: { message_id: string; thread_id: string; message_file_id: string };
};

export interface MessagesSaveOptions {
  threadInitialMessage?: boolean;
  enforceViewPropagation?: boolean;
  message_moved?: boolean;
  previous_thread?: string; //If message was in a previous thread before (moved) then this indicate when is it from
}
export interface MessagesGetThreadOptions {
  replies_per_thread?: number;
  includeQuoteInMessage?: boolean;
}

export type SearchMessageOptions = {
  search?: string;
  companyId?: string;
  workspaceId?: string;
  channelId?: string;
  hasFiles?: boolean;
  hasMedias?: boolean;
  sender?: string;
};

export type SearchMessageFilesOptions = {
  search?: string;
  companyId?: string;
  workspaceId?: string;
  channelId?: string;
  sender?: string;
  isFile?: boolean;
  isMedia?: boolean;
  extension?: string;
};

export type InboxOptions = {
  companyId: string;
};

export type FlatFileFromMessage = {
  file: MessageFile;
  thread: MessageWithReplies;
  context: MessageFileRef;
};

export type FlatPinnedFromMessage = {
  message: any;
  thread: any;
};

export interface DeleteLinkOperation {
  message_id: string;
  thread_id: string;
  link: string;
}

export type UpdateDeliveryStatusOperation = {
  status: "delivered" | "read";
  self_message?: boolean;
} & MessageIdentifier;

export type MessageReadType = {
  messages: MessageIdentifier[];
  channel_id: string;
};

export type MessageIdentifier = {
  message_id: string;
  thread_id: string;
};
