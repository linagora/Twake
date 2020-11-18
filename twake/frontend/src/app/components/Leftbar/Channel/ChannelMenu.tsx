import React, { useState } from 'react';

import Icon from 'components/Icon/Icon.js';
import Menu from 'components/Menus/Menu.js';
import Languages from 'services/languages/languages.js';
import { ChannelType } from 'app/models/Channel';
import AlertManager from 'services/AlertManager/AlertManager';
import UserService from 'services/user/user.js';
import ModalManager from 'app/services/Modal/ModalManager';
import ChannelWorkspaceEditor from 'app/scenes/Client/ChannelsBar/ChannelWorkspaceEditor';
import Notifications from 'services/user/notifications.js';

type Props = {
  channel: ChannelType;
};

export default (props: Props): JSX.Element => {
  const userName = UserService.getCurrentUser().username;
  Languages.useListener(useState);
  Notifications.useListener(useState);
  //@ts-ignore
  const hasNotification = (Notifications.notification_by_channel[props.channel.id] || {}).count > 0;

  const addOrCancelFavorite = () => {};

  const displayMembers = () => {};

  const leaveChannel = () => {};

  const editChannel = () => {
    ModalManager.open(
      <ChannelWorkspaceEditor title={'Edit Channel'} channel={props.channel || {}} />,
      {
        position: 'center',
        size: { width: '600px' },
      },
    );
  };

  const removeChannel = () => {};

  // Add translations
  let menu: object[] = [
    {
      type: 'menu',
      text: Languages.t('scenes.apps.messages.left_bar.stream.notifications'),
      onClick: () => {},
      submenu: [
        {
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.all'),
          icon: 'check',
        },
        {
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.mentions', [
            '@all',
            '@here',
            `@${userName}`,
          ]),
        },
        {
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.me', [
            `@${userName}`,
          ]),
        },
        { text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.never') },
      ],
    },
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
        props.channel.user_member?.favorite
          ? 'scenes.apps.messages.left_bar.stream.add_to_favorites'
          : 'scenes.apps.messages.left_bar.stream.remove_from_favorites',
      ),
      onClick: () => {
        addOrCancelFavorite();
      },
    },
    {
      type: 'separator',
    },
    {
      type: 'menu',
      text: Languages.t('scenes.apps.parameters.workspace_sections.members'),
      onClick: () => {
        displayMembers();
      },
    },
    {
      type: 'menu',
      text: Languages.t('scenes.app.channelsbar.modify_channel_menu'),
      onClick: () => {
        editChannel();
      },
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

  //To do: Add the necessery admin rights
  if (true) {
    menu.push({
      type: 'menu',
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
