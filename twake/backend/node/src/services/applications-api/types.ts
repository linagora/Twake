import { Channel } from "../channels/entities";
import { Message } from "../messages/entities/messages";
import { Thread } from "../messages/entities/threads";

export type HookType = {
  type: "message";
  application_id: string;
  company_id: string;

  channel?: Channel;
  thread: Thread;
  message: Message;
};
