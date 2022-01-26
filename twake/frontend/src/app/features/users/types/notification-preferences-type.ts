import { Resource } from 'app/deprecated/CollectionsReact/Collections';

export type preferencesType = {
  highlight_words: string[];
  night_break: {
    enable: boolean;
    from: number;
    to: number;
  };
  private_message_content: boolean;
  mobile_notifications: string;
  email_notifications_delay: number;
  deactivate_notifications_until: number;
  notification_sound: string;
};
export type NotificationPreferencesType = {
  user_id: string;
  company_id: string;
  workspace_id: string;
  preferences: preferencesType;
};

export class NotificationPreferencesResource extends Resource<NotificationPreferencesType> {
  _type = 'notification_preferences';
  _resourcePrimaryKey = ['user_id', 'company_id', 'workspace_id'];
}
