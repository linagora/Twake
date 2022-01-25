import { PendingEmailResource } from 'app/models/PendingEmail';
import { ChannelMemberResource } from 'app/features/channels/types/channel';

export type GenericMemberType = 'pending-email' | 'guest';

export type GenericMember = {
  key: string;
  type: GenericMemberType;
  filterString: string;
  resource: PendingEmailResource | ChannelMemberResource;
};
