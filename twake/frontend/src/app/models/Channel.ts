import { Resource } from 'services/CollectionsReact/Collections';

export type ChannelType = {
  company_id?: string;
  workspace_id?: string | null; //Null for direct messages
  type?: string;
  id?: string;
  icon?: string;
  name?: string;
  description?: string;
  channel_group?: string;
  visibility?: string;
  default?: boolean;
  members?: string[];
  owner?: string;
  members_count?: number;
  guests_count?: number;
  messages_count?: number;
  archived?: false | true;
  archivation_date?: number; //Timestamp
  user_member?: ChannelMemberType;
  connectors?: string[];
  last_activity?: number;
};

export type ChannelMemberType = {
  user_id?: string;
  channel_id?: string;
  type?: 'member' | 'guest' | 'bot';
  last_access?: number; //Timestamp in seconds
  last_increment?: number; //Number
  favorite?: boolean; //Did the user add this channel to its favorites
  notification_level?: 'all' | 'none' | 'mentions' | 'me';
};

export class ChannelResource extends Resource<ChannelType> {
  _type = 'channel';
}

export class ChannelMemberResource extends Resource<ChannelMemberType> {
  _type = 'channel_member';
  _resourcePrimaryKey = ['channel_id', 'user_id'];
  _resourceIdKey = 'user_id';
}
