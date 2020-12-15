import React from 'react';

import ChannelUI from './Channel';
import ChannelMenu from './ChannelMenu';

import { ChannelResource, ChannelType, ChannelMemberResource } from 'app/models/Channel';

import RouterServices, { ClientStateType } from 'services/RouterService';
import { Collection } from 'services/CollectionsReact/Collections';
import UsersService from 'services/user/user.js';

type Props = {
  channelId: string;
  collection: Collection<ChannelResource>;
};

export default (props: Props): JSX.Element => {
  const userId: string = UsersService.getCurrentUserId();
  const { companyId }: ClientStateType = RouterServices.useStateFromRoute();
  const menu = (channel: ChannelResource) => {
    return <ChannelMenu channel={channel} />;
  };

  const channel = props.collection.useWatcher(
    { id: props.channelId },
    { query: { mine: true } },
  )[0];
  const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${channel?.data?.workspace_id}/channels/${props.channelId}/members/`;
  const channelMembersCollection: Collection<ChannelMemberResource> = Collection.get(
    collectionPath,
    ChannelMemberResource,
  );
  const userMember: ChannelMemberResource = channelMembersCollection.useWatcher({
    user_id: userId,
  })[0];

  if (!channel) return <></>;

  return (
    <ChannelUI
      collection={props.collection}
      name={channel.data.name || ''}
      icon={channel.data.icon || ''}
      muted={channel.data.user_member?.notification_level === 'none'}
      favorite={channel.data.user_member?.favorite || false}
      unreadMessages={false}
      visibility={channel.data.visibility || 'public'}
      notifications={channel.data.messages_count || 0}
      menu={menu(channel)}
      id={channel.data.id}
    />
  );
};
