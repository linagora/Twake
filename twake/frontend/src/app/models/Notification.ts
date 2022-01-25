import { Resource } from 'app/deprecated/CollectionsReact/Collections';

export type NotificationType = {
  user_id: string;
  company_id: string;
  workspace_id: string | 'all';
  channel_id: string | 'all';
  thread_id: string | 'all';

  count: number;
};

export class NotificationResource extends Resource<NotificationType> {
  _type = 'notification';
  _resourcePrimaryKey = ['channel_id', 'thread_id'];
  _resourceIdKey = 'id';
}
