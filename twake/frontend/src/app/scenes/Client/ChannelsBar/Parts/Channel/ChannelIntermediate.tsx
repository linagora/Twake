import React from 'react';

import ChannelUI from './Channel';
import ChannelMenu from './ChannelMenu';

import { ChannelResource, ChannelType, ChannelMemberResource } from 'app/models/Channel';

import RouterServices, { ClientStateType } from 'services/RouterService';
import { Collection } from 'services/CollectionsReact/Collections';
import UsersService from 'services/user/user.js';

type Props = {
  channel: ChannelType;
  collection: Collection<ChannelResource>;
};

export default (props: Props): JSX.Element => {
  const userId: string = UsersService.getCurrentUserId();
  const { companyId }: ClientStateType = RouterServices.useStateFromRoute();
  const menu = (channel: ChannelResource) => {
    if (!channel) return <></>;
    return <ChannelMenu channel={channel} />;
  };

  const channel = props.collection.useWatcher(
    { id: props.channel.id },
    { query: { mine: true } },
  )[0];
  const collectionPath: string = `/channels/v1/companies/${props.channel.company_id}/workspaces/${props.channel.workspace_id}/channels/${props.channel.id}/members/`;
  const channelMembersCollection: Collection<ChannelMemberResource> = Collection.get(
    collectionPath,
    ChannelMemberResource,
  );
  const userMember: ChannelMemberResource = channelMembersCollection.useWatcher({
    user_id: userId,
  })[0];

  if (!channel || !channel.data.user_member?.id || !channel.state.persisted) return <></>;

  return (
    <ChannelUI
      collection={props.collection}
      name={channel.data.name || ''}
      icon={channel.data.icon || ''}
      muted={channel.data.user_member?.notification_level === 'none'}
      favorite={channel.data.user_member?.favorite || false}
      unreadMessages={false}
      visibility={channel.data.visibility || 'public'}
      notifications={channel.data.messages_count || 1}
      menu={menu(channel)}
      id={channel.data.id}
    />
  );
};
