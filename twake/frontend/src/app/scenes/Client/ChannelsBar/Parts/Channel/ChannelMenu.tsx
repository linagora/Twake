import React, { useState } from 'react';

import { ChannelMemberType, ChannelResource, ChannelMemberResource } from 'app/models/Channel';
import ChannelMembersList from 'scenes/Client/ChannelsBar/Modals/ChannelMembersList';
import Icon from 'components/Icon/Icon';
import Menu from 'components/Menus/Menu';
import { Collection } from 'services/CollectionsReact/Collections';
import Languages from 'services/languages/languages';
import Collections from 'services/CollectionsReact/Collections';
import AlertManager from 'services/AlertManager/AlertManager';
import UserService from 'services/user/UserService';
import ModalManager from 'app/components/Modal/ModalManager';
import ChannelWorkspaceEditor from 'app/scenes/Client/ChannelsBar/Modals/ChannelWorkspaceEditor';
import Notifications from 'app/services/user/UserNotifications';
import AccessRightsService from 'app/services/AccessRightsService';
import { NotificationResource } from 'app/models/Notification';
import RouterServices from 'app/services/RouterService';
import GuestManagement from 'app/scenes/Client/ChannelsBar/Modals/GuestManagement';
import { getChannelMembers, getMine } from 'app/services/channels/ChannelCollectionPath';
import { useFeatureToggles } from 'app/components/LockedFeaturesComponents/FeatureTogglesHooks';
import LockedGuestsPopup from 'app/components/LockedFeaturesComponents/LockedGuestsPopup/LockedGuestsPopup';
import InitService from 'app/services/InitService';

type Props = {
  channel: ChannelResource;
  onClick: () => void;
  onClose: () => void;
};

export default (props: Props): JSX.Element => {
  const currentUser = UserService.getCurrentUser();
  const companyId = props.channel.data.company_id;
  const channelWorkspaceId = props.channel.data.workspace_id;
  const { workspaceId } = RouterServices.getStateFromRoute();
  const channelMembersCollection = Collections.get(
    getChannelMembers(companyId, channelWorkspaceId, props.channel.data.id),
    ChannelMemberResource,
  );
  const channelsCollection = Collection.get(
    getMine(companyId, channelWorkspaceId),
    ChannelResource,
  );
  const isDirectChannel = props.channel.data.visibility === 'direct';
  const { FeatureToggles, Feature, activeFeatureNames, FeatureNames } = useFeatureToggles();

  Languages.useListener(useState);

  const notificationsCollection = Collection.get('/notifications/v1/badges/', NotificationResource);

  const changeNotificationPreference = async (preference: 'all' | 'none' | 'mentions' | 'me') => {
    const channelMember: ChannelMemberType = props.channel.data.user_member || {};
    channelMember.user_id = channelMember.user_id || currentUser.id;
    channelMember.notification_level = 'all';
    channelMember.notification_level = preference;
    channelMember.channel_id = props.channel.id;

    await channelMembersCollection.upsert(new ChannelMemberResource(channelMember));
  };

  const addOrCancelFavorite = async (state: boolean) => {
    const channelMember: ChannelMemberType = props.channel.data.user_member || {};
    channelMember.user_id = channelMember.user_id || currentUser.id;
    channelMember.favorite = state;
    channelMember.channel_id = props.channel.id;
    await channelMembersCollection.upsert(new ChannelMemberResource(channelMember));
  };

  const displayMembers = () => {
    return ModalManager.open(<ChannelMembersList channel={props.channel} closable />, {
      position: 'center',
      size: { width: '600px', minHeight: '329px' },
    });
  };

  const displayGuestManagement = () => {
    return ModalManager.open(
      <FeatureToggles features={activeFeatureNames}>
        <Feature
          name={FeatureNames.GUESTS}
          inactiveComponent={() => (
            <LockedGuestsPopup
              companySubscriptionUrl={
                InitService.server_infos?.configuration?.accounts?.console
                  ?.company_subscription_url || ''
              }
            />
          )}
          activeComponent={() => <GuestManagement channel={props.channel} />}
        />
      </FeatureToggles>,
      {
        position: 'center',
        size: { width: '600px', minHeight: '329px' },
      },
    );
  };

  const leaveChannel = async () => {
    try {
      channelMembersCollection
        .remove(
          {
            user_id: UserService.getCurrentUserId(),
            channel_id: props.channel.id,
          },
          { force: true },
        )
        .then(redirectToWorkspace);
    } catch (err) {
      console.log('Error in ChannelMenu.tsx', err);
    }
  };

  const redirectToWorkspace = () => {
    const url = RouterServices.generateRouteFromState({ workspaceId: workspaceId, channelId: '' });
    return RouterServices.push(url);
  };

  const editChannel = () => {
    ModalManager.open(
      <ChannelWorkspaceEditor
        title={Languages.t('scenes.app.channelsbar.modify_channel_menu')}
        channel={props.channel || {}}
        currentUserId={currentUser.id}
      />,
      {
        position: 'center',
        size: { width: '600px' },
      },
    );
  };

  const removeChannel = async () =>
    await channelsCollection.remove({ id: props.channel.data.id }).then(redirectToWorkspace);

  let menu: object[] = [
    {
      type: 'menu',
      text: Languages.t(
        notificationsCollection.find({ channel_id: props.channel.id }).length > 0
          ? 'scenes.app.channelsbar.read_sign'
          : 'scenes.app.channelsbar.unread_sign',
      ),
      onClick: () => {
        notificationsCollection.find({ channel_id: props.channel.id }).length > 0
          ? Notifications.read(props.channel)
          : Notifications.unread(props.channel);
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
      hide: !AccessRightsService.hasLevel(workspaceId, 'member'),
      type: 'separator',
    },
    {
      type: 'menu',
      hide: !AccessRightsService.hasLevel(workspaceId, 'member'),
      text: Languages.t(
        isDirectChannel
          ? 'scenes.app.channelsbar.hide_discussion_leaving.menu'
          : 'scenes.app.channelsbar.channel_leaving',
      ),
      className: 'danger',
      onClick: () => {
        if (props.channel.data.visibility === 'private') {
          return AlertManager.confirm(() => leaveChannel(), undefined, {
            title: Languages.t('components.alert.leave_private_channel.title'),
            text: Languages.t('components.alert.leave_private_channel.description'),
          });
        } else return leaveChannel();
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
          icon: props.channel.data.user_member?.notification_level === 'mentions' && 'check',
          onClick: () => {
            changeNotificationPreference('mentions');
          },
        },
        {
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.me', [
            `@${currentUser.username}`,
          ]),
          icon: props.channel.data.user_member?.notification_level === 'me' && 'check',
          onClick: () => {
            changeNotificationPreference('me');
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
        hide: !AccessRightsService.hasLevel(workspaceId, 'member'),
        text: Languages.t('scenes.app.channelsbar.modify_channel_menu'),
        onClick: () => editChannel(),
      },
      {
        type: 'menu',
        text: Languages.t('scenes.apps.parameters.workspace_sections.members'),
        onClick: () => displayMembers(),
      },
      {
        type: 'menu',
        text: Languages.t('scenes.app.channelsbar.guest_management'),
        hide: AccessRightsService.getCompanyLevel(companyId) === 'guest',
        onClick: () => displayGuestManagement(),
      },
    );
  }

  if (props.channel.data.visibility !== 'direct') {
    menu.push({
      type: 'menu',
      hide:
        currentUser.id !== props.channel.data.owner &&
        !AccessRightsService.hasLevel(workspaceId, 'admin'),
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
          <Menu menu={menu} className="options" onClose={props.onClose}>
            <Icon type="ellipsis-h more-icon grey-icon" onClick={props.onClick} />
          </Menu>
        </div>
      )}
    </>
  );
};
