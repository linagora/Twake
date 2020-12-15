type specialMention = "all" | "here" | "everyone" | "channel";
type uuid = string;

export type MessageNotification = {
  company_id: uuid;
  workspace_id: uuid | "direct";
  channel_id: uuid;
  thread_id: uuid;
  id: uuid;
  sender: uuid;
  mentions?: {
    users?: uuid[];
    teams?: uuid[];
    specials?: specialMention[];
  };
};

export type MessageNotificationResult = MessageNotification;
