import { uuid } from "../types";

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
