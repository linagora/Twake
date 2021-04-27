import { ExecutionContext } from "../../core/platform/framework/api/crud-service";
import { uuid } from "../types";
import { MessageFileMetadata } from "./entities/message-files";
import { Message } from "./entities/messages";

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

export interface CompanyExecutionContext extends ExecutionContext {
  company: { id: string };
}

export interface ThreadExecutionContext extends ExecutionContext {
  thread: { id: string; company_id: string };
}

export interface MessageLocalEvent {
  resource: Message;
  context: ThreadExecutionContext;
  created: boolean;
}
