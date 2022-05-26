// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';

import { ChannelType } from 'app/features/channels/types/channel';
import ChannelMembersList from 'app/views/client/channels-bar/Modals/ChannelMembersList';
import Icon from 'app/components/icon/icon';
import Menu from 'components/menus/menu';
import Languages from 'app/features/global/services/languages-service';
import AlertManager from 'app/features/global/services/alert-manager-service';
import UserService from 'app/features/users/services/current-user-service';
import ModalManager from 'app/components/modal/modal-manager';
import ChannelWorkspaceEditor from 'app/views/client/channels-bar/Modals/ChannelWorkspaceEditor';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import RouterServices from 'app/features/router/services/router-service';
import GuestManagement from 'app/views/client/channels-bar/Modals/GuestManagement';
import { useFeatureToggles } from 'app/components/locked-features-components/feature-toggles-hooks';
import LockedGuestsPopup from 'app/components/locked-features-components/locked-guests-popup/locked-guests-popup';
import InitService from 'app/features/global/services/init-service';
import ChannelsMineAPIClient from 'app/features/channels/api/channels-mine-api-client';
import ChannelMembersAPIClient from 'app/features/channel-members/api/channel-members-api-client';
import { isDirectChannel, isPrivateChannel } from 'app/features/channels/utils/utils';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { ToasterService as Toaster } from 'app/features/global/services/toaster-service';
import { useRefreshFavoriteChannels } from 'app/features/channels/hooks/use-favorite-channels';
import FeatureTogglesService from 'app/features/global/services/feature-toggles-service';
import ChannelAPIClient from 'app/features/channels/api/channel-api-client';
import { useRefreshDirectChannels } from 'app/features/channels/hooks/use-direct-channels';
import { useChannelNotifications } from 'app/features/users/hooks/use-notifications';
import consoleService from 'app/features/console/services/console-service';

type PropsType = {
  channel: ChannelType;
  onClick: () => void;
  onClose: () => void;
};

export default (props: PropsType): JSX.Element => {
  const [showMenu, setShowMenu] = React.useState(false);

  if (showMenu) {
    return <FullMenu onClose={props.onClose} onClick={props.onClick} channel={props.channel} />;
  }

  return (
    <>
      <div className="more-icon" onMouseOver={() => setShowMenu(true)}>
        <Icon type="ellipsis-h more-icon grey-icon" />
      </div>
    </>
  );
};

const FullMenu = (props: PropsType): JSX.Element => {
  const companyId = props.channel.company_id;
  const workspaceId = useRouterWorkspace();
  const { badges } = useChannelNotifications(props.channel.id || '');
  const { user: currentUser } = useCurrentUser();
  const { refresh: refreshFavoriteChannels } = useRefreshFavoriteChannels();
  const { refresh: refreshDirectChannels } = useRefreshDirectChannels();
  const { Feature, FeatureNames } = useFeatureToggles();
  const channelMember = props.channel.user_member || {};

  Languages.useListener();

  const changeNotificationPreference = async (preference: 'all' | 'none' | 'mentions' | 'me') => {
    if (
      props.channel.company_id &&
      props.channel.workspace_id &&
      props.channel.id &&
      currentUser?.id
    ) {
      await ChannelMembersAPIClient.updateChannelMemberPreferences(
        channelMember,
        { notification_level: preference },
        {
          companyId: props.channel.company_id,
          workspaceId: props.channel.workspace_id,
          channelId: props.channel.id,
          userId: currentUser.id,
        },
      ).finally(refreshFavoriteChannels);
    }
  };

  const addOrCancelFavorite = async (state: boolean) => {
    if (
      props.channel.company_id &&
      props.channel.workspace_id &&
      props.channel.id &&
      currentUser?.id
    ) {
      await ChannelMembersAPIClient.updateChannelMemberPreferences(
        channelMember,
        { favorite: state },
        {
          companyId: props.channel.company_id,
          workspaceId: props.channel.workspace_id,
          channelId: props.channel.id,
          userId: currentUser.id,
        },
      ).finally(refreshFavoriteChannels);
    }
  };

  const displayMembers = () => {
    return ModalManager.open(<ChannelMembersList channel={props.channel} closable />, {
      position: 'center',
      size: { width: '600px', minHeight: '329px' },
    });
  };

  const displayGuestManagement = () => {
    return ModalManager.open(
      FeatureTogglesService.isActiveFeatureName(FeatureNames.GUESTS) ? (
        <GuestManagement channel={props.channel} />
      ) : (
        <LockedGuestsPopup
          companySubscriptionUrl={
            consoleService.getCompanySubscriptionUrl(props.channel.company_id || "")
          }
        />
      ),
      {
        position: 'center',
        size: { width: '600px', minHeight: '329px' },
      },
    );
  };

  const leaveChannel = async (isDirectChannel = false) => {
    if (props.channel?.id && props.channel?.company_id && workspaceId) {
      const res = await ChannelsMineAPIClient.removeUser(UserService.getCurrentUserId(), {
        companyId: props.channel.company_id,
        workspaceId: isDirectChannel ? 'direct' : workspaceId,
        channelId: props.channel.id,
      });

      if (res?.error?.length && res?.message?.length) {
        Toaster.error(`${res.error} - ${res.message}`);
      } else {
        redirectToWorkspace();
        refreshFavoriteChannels();
        refreshDirectChannels();
      }
    }
  };

  const redirectToWorkspace = () => {
    const url = RouterServices.generateRouteFromState({
      companyId,
      workspaceId,
      channelId: '',
    });
    return RouterServices.push(url);
  };

  const editChannel = () => {
    ModalManager.open(
      <ChannelWorkspaceEditor
        title={Languages.t('scenes.app.channelsbar.modify_channel_menu')}
        channel={props.channel || {}}
        currentUserId={currentUser?.id}
      />,
      {
        position: 'center',
        size: { width: '600px' },
      },
    );
  };

  const removeChannel = async () => {
    if (companyId && workspaceId && props.channel.id) {
      await ChannelsMineAPIClient.removeChannel(companyId, workspaceId, props.channel.id).then(
        redirectToWorkspace,
      );
    }
  };

  let menu: object[] = [
    {
      type: 'menu',
      text: Languages.t(
        badges.length > 0
          ? 'scenes.app.channelsbar.read_sign'
          : 'scenes.app.channelsbar.unread_sign',
      ),
      onClick: () => {
        badges.length > 0
          ? ChannelAPIClient.read(
              props.channel.company_id || '',
              props.channel.workspace_id || '',
              props.channel.id || '',
              { status: true, now: true },
            )
          : ChannelAPIClient.read(
              props.channel.company_id || '',
              props.channel.workspace_id || '',
              props.channel.id || '',
              { status: false, now: true },
            );
      },
    },
    {
      type: 'menu',
      text: Languages.t(
        props.channel.user_member?.favorite
          ? 'scenes.apps.messages.left_bar.stream.remove_from_favorites'
          : 'scenes.apps.messages.left_bar.stream.add_to_favorites',
      ),
      onClick: () => {
        addOrCancelFavorite(!props.channel.user_member?.favorite);
      },
    },
    {
      hide: !(
        AccessRightsService.hasLevel(workspaceId, 'member') &&
        AccessRightsService.getCompanyLevel(companyId) !== 'guest'
      ),
      type: 'separator',
    },
    {
      type: 'menu',
      hide: !(
        AccessRightsService.hasLevel(workspaceId, 'member') &&
        AccessRightsService.getCompanyLevel(companyId) !== 'guest'
      ),
      text: Languages.t(
        props.channel.visibility && isDirectChannel(props.channel.visibility)
          ? 'scenes.app.channelsbar.hide_discussion_leaving.menu'
          : 'scenes.app.channelsbar.channel_leaving',
      ),
      className: 'danger',
      onClick: () => {
        if (props.channel.visibility) {
          if (isPrivateChannel(props.channel.visibility)) {
            return AlertManager.confirm(() => leaveChannel(), undefined, {
              title: Languages.t('components.alert.leave_private_channel.title'),
              text: Languages.t('components.alert.leave_private_channel.description'),
            });
          }
          if (isDirectChannel(props.channel.visibility)) {
            return leaveChannel(true);
          }
        }

        return leaveChannel();
      },
    },
  ];

  if (props.channel.visibility && isDirectChannel(props.channel.visibility) === false) {
    menu.unshift({
      type: 'menu',
      text: Languages.t('scenes.apps.messages.left_bar.stream.notifications'),
      submenu: [
        {
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.all'),
          icon: props.channel.user_member?.notification_level === 'all' && 'check',
          onClick: () => {
            changeNotificationPreference('all');
          },
        },
        {
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.mentions', [
            '@all',
            '@here',
            `@[you]`,
          ]),
          icon: props.channel.user_member?.notification_level === 'mentions' && 'check',
          onClick: () => {
            changeNotificationPreference('mentions');
          },
        },
        {
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.me', [`@[you]`]),
          icon: props.channel.user_member?.notification_level === 'me' && 'check',
          onClick: () => {
            changeNotificationPreference('me');
          },
        },
        {
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.never'),
          icon: props.channel.user_member?.notification_level === 'none' && 'check',
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
        hide: !(
          AccessRightsService.hasLevel(workspaceId, 'member') &&
          AccessRightsService.getCompanyLevel(companyId) !== 'guest'
        ),
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

  if (props.channel.visibility && isDirectChannel(props.channel.visibility) === false) {
    menu.push({
      type: 'menu',
      hide:
        currentUser?.id !== props.channel.owner &&
        !AccessRightsService.hasLevel(workspaceId, 'moderator'),
      text: Languages.t('scenes.app.channelsbar.channel_removing'),
      className: 'danger',
      onClick: () => {
        AlertManager.confirm(() => removeChannel());
      },
    });
  }

  return (
    <>
      <div className="more-icon">
        <Menu menu={menu} className="options" onClose={props.onClose}>
          <Icon type="ellipsis-h more-icon grey-icon" onClick={props.onClick} />
        </Menu>
      </div>
    </>
  );
};
