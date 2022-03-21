import { Resource } from 'app/deprecated/CollectionsReact/Collections';
import { ChannelMemberType } from 'app/features/channel-members/types/channel-member-types';
import { UserType } from 'app/features/users/types/user';

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
  is_default?: boolean;
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
  last_message?: {
    date: number;
    sender: string;
    title: string;
    text: string;
  };
  users?: UserType[];
};

export class ChannelResource extends Resource<ChannelType> {
  _type = 'channel';
}

export class ChannelMemberResource extends Resource<ChannelMemberType> {
  _type = 'channel_member';
  _resourcePrimaryKey = ['channel_id', 'user_id'];
  _resourceIdKey = 'user_id';
}
