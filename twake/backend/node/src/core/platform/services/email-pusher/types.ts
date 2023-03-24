import { Channel } from "../../../../services/channels/entities/channel";
import { Message } from "../../../../services/messages/entities/messages";
import Company from "../../../../services/user/entities/company";
import Workspace from "../../../../services/workspaces/entities/workspace";
import User from "../../../../services/user/entities/user";
import { UserObject } from "../../../../services/user/web/types";

export type EmailBuilderDataPayload = {
  user: User;
  company: Company;
  notifications: {
    channel: Channel;
    workspace: Workspace;
    message: Message & { user: UserObject };
  }[];
};

export type EmailBuilderRenderedResult = {
  html: string;
  text: string;
  subject: string;
};

export type EmailBuilderTemplateName = "notification-digest";

export type EmailPusherPayload = {
  subject: string;
  html: string;
  text: string;
};

export type EmailPusherEmailType = {
  sender: string;
  html_body: string;
  text_body: string;
  to: string[];
  subject: string;
};

export type EmailPusherResponseType = {
  data: {
    succeeded: number;
    failed: number;
    failures: string[];
    error?: string;
    error_code?: string;
  };
};

export type EmailLanguageType = "en" | "fr";
