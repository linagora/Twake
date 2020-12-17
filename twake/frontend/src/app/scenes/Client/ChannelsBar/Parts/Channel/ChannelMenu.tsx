import React, { useState } from 'react';

import {
  ChannelType,
  ChannelMemberType,
  ChannelResource,
  ChannelMemberResource,
} from 'app/models/Channel';

import ChannelMembersList from 'scenes/Client/ChannelsBar/Modals/ChannelMembersList';

import Icon from 'components/Icon/Icon.js';
import Menu from 'components/Menus/Menu.js';

import { Collection } from 'services/CollectionsReact/Collections';
import Languages from 'services/languages/languages.js';
import Collections from 'services/CollectionsReact/Collections';
import AlertManager from 'services/AlertManager/AlertManager';
import UserService from 'services/user/user.js';
import ModalManager from 'app/components/Modal/ModalManager';
import ChannelWorkspaceEditor from 'app/scenes/Client/ChannelsBar/Modals/ChannelWorkspaceEditor';
import Notifications from 'services/user/notifications.js';
import RouterServices from 'services/RouterService';
import AccessRightsService from 'app/services/AccessRightsService';

type Props = {
  channel: ChannelResource;
};

export default (props: Props): JSX.Element => {
  const currentUser = UserService.getCurrentUser();
  const companyId = props.channel.data.company_id;
  const workspaceId = props.channel.data.workspace_id;

  const channelPath = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/::mine`;
  const channelMembersPath = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${props.channel.data.id}/members/`;
  const channelMembersCollection = Collections.get(channelMembersPath, ChannelMemberResource);
  const channelsCollection = Collection.get(channelPath, ChannelResource);

  const isCurrentUserAdmin: boolean = AccessRightsService.useWatcher(() =>
    AccessRightsService.hasLevel(workspaceId || '', 'administrator'),
  );

  Languages.useListener(useState);
  Notifications.useListener(useState);
  //@ts-ignore
  const hasNotification =
    (Notifications.notification_by_channel[props.channel.data.id || ''] || {}).count > 0;

  const changeNotificationPreference = async (
    preference: 'all' | 'none' | 'group_mentions' | 'user_mentions',
  ) => {
    const channelMember: ChannelMemberType = props.channel.data.user_member || {};
    channelMember.user_id = channelMember.user_id || currentUser.id;
    channelMember.notification_level = 'all';
    channelMember.notification_level = preference;

    await channelMembersCollection.upsert(new ChannelMemberResource(channelMember));
  };

  const addOrCancelFavorite = async (state: boolean) => {
    const channelMember: ChannelMemberType = props.channel.data.user_member || {};
    channelMember.user_id = channelMember.user_id || currentUser.id;
    channelMember.favorite = state;
    await channelMembersCollection.upsert(new ChannelMemberResource(channelMember));
  };

  const displayMembers = () => {
    return ModalManager.open(<ChannelMembersList channel={props.channel} closable />, {
      position: 'center',
      size: { width: '600px', minHeight: '329px' },
    });
  };

  const leaveChannel = async () => {
    if (props.channel.data.user_member) {
      //Fixme, this is not pretty, we should find a way to do this in one line
      const channelMember = new ChannelMemberResource(props.channel.data.user_member);
      channelMember.setPersisted();
      await channelMembersCollection.upsert(channelMember, { withoutBackend: true });
      return await channelMembersCollection.remove(channelMember);
    }
  };

  const editChannel = () => {
    ModalManager.open(
      <ChannelWorkspaceEditor
        title={Languages.t('scenes.app.channelsbar.modify_channel_menu')}
        channel={props.channel || {}}
        isCurrentUserAdmin={isCurrentUserAdmin}
        currentUserId={currentUser.id}
      />,
      {
        position: 'center',
        size: { width: '600px' },
      },
    );
  };

  const removeChannel = () => {
    return channelsCollection.remove({ id: props.channel.data.id });
  };

  let menu: object[] = [
    {
      type: 'menu',
      text: Languages.t(
        hasNotification ? 'scenes.app.channelsbar.read_sign' : 'scenes.app.channelsbar.unread_sign',
      ),
      onClick: () => {
        hasNotification ? Notifications.read(props.channel) : Notifications.unread(props.channel);
      },
    },
    {
      type: 'menu',
      text: Languages.t(
        props.channel.data.user_member?.favorite
          ? 'scenes.apps.messages.left_bar.stream.remove_from_favorites'
          : 'scenes.apps.messages.left_bar.stream.add_to_favorites',
      ),
      onClick: () => {
        addOrCancelFavorite(!props.channel.data.user_member?.favorite);
      },
    },
    {
      type: 'separator',
    },
    {
      type: 'menu',
      text: Languages.t('scenes.app.channelsbar.channel_leaving'),
      className: 'danger',
      onClick: () => {
        AlertManager.confirm(() => leaveChannel());
      },
    },
  ];

  if (props.channel.data.visibility !== 'direct') {
    menu.unshift({
      type: 'menu',
      text: Languages.t('scenes.apps.messages.left_bar.stream.notifications'),
      submenu: [
        {
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.all'),
          icon: props.channel.data.user_member?.notification_level === 'all' && 'check',
          onClick: () => {
            changeNotificationPreference('all');
          },
        },
        {
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.mentions', [
            '@all',
            '@here',
            `@${currentUser.username}`,
          ]),
          icon: props.channel.data.user_member?.notification_level === 'group_mentions' && 'check',
          onClick: () => {
            changeNotificationPreference('group_mentions');
          },
        },
        {
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.me', [
            `@${currentUser.username}`,
          ]),
          icon: props.channel.data.user_member?.notification_level === 'user_mentions' && 'check',
          onClick: () => {
            changeNotificationPreference('user_mentions');
          },
        },
        {
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.never'),
          icon: props.channel.data.user_member?.notification_level === 'none' && 'check',
          onClick: () => {
            changeNotificationPreference('none');
          },
        },
      ],
    });
    menu.splice(
      4,
      0,
      {
        type: 'menu',
        text: Languages.t('scenes.app.channelsbar.modify_channel_menu'),
        onClick: () => {
          editChannel();
        },
      },
      {
        type: 'menu',
        text: Languages.t('scenes.apps.parameters.workspace_sections.members'),
        onClick: () => {
          displayMembers();
        },
      },
    );
  }

  //To do: Add the necessery admin rights
  if (true && props.channel.data.visibility !== 'direct') {
    menu.push({
      type: 'menu',
      hide: currentUser.id !== props.channel.data.owner && isCurrentUserAdmin === false,
      text: Languages.t('scenes.app.channelsbar.channel_removing'),
      className: 'danger',
      onClick: () => {
        AlertManager.confirm(() => removeChannel());
      },
    });
  }

  return (
    <>
      {!!menu.length && (
        <div className="more-icon">
          <Menu menu={menu} className="options">
            <Icon type="ellipsis-h more-icon grey-icon" />
          </Menu>
        </div>
      )}
    </>
  );
};
