import { PendingEmailResource } from 'app/features/workspace-members/types/pending-email';
import { ChannelMemberResource } from 'app/features/channels/types/channel';

export type GenericMemberType = 'pending-email' | 'guest';

export type GenericMember = {
  key: string;
  type: GenericMemberType;
  filterString: string;
  resource: PendingEmailResource | ChannelMemberResource;
};
