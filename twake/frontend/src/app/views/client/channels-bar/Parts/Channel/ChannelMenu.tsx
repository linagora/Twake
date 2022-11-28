import React from 'react';

import { useOpenChannelModal } from 'app/components/edit-channel';
import Icon from 'app/components/icon/icon';
import ChannelAPIClient from 'app/features/channels/api/channel-api-client';
import { useRefreshPublicOrPrivateChannels } from 'app/features/channels/hooks/use-public-or-private-channels';
import { ChannelType } from 'app/features/channels/types/channel';
import Languages from 'app/features/global/services/languages-service';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { useChannelNotifications } from 'app/features/users/hooks/use-notifications';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import Menu from 'components/menus/menu';

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
      <div className="more-icon ml-1" onMouseOver={() => setShowMenu(true)}>
        <Icon type="ellipsis-h more-icon grey-icon" />
      </div>
    </>
  );
};

const FullMenu = (props: PropsType): JSX.Element => {
  const companyId = props.channel.company_id;
  const workspaceId = useRouterWorkspace();
  const { badges } = useChannelNotifications(props.channel.id || '');
  const { refresh: refreshChannels } = useRefreshPublicOrPrivateChannels();
  const openChannelModal = useOpenChannelModal();

  Languages.useListener();

  const editChannel = () => {
    openChannelModal(props.channel.id || '');
  };

  const menu: object[] = [
    {
      type: 'menu',
      text: Languages.t(
        badges.length > 0
          ? 'scenes.app.channelsbar.read_sign'
          : 'scenes.app.channelsbar.unread_sign',
      ),
      onClick: () => {
        ChannelAPIClient.read(
          props.channel.company_id || '',
          props.channel.workspace_id || '',
          props.channel.id || '',
          { status: badges.length > 0, now: true },
        );
        refreshChannels();
      },
    },
    {
      type: 'menu',
      hide: !(
        AccessRightsService.hasLevel(workspaceId, 'member') &&
        AccessRightsService.getCompanyLevel(companyId) !== 'guest'
      ),
      text: Languages.t('scenes.app.channelsbar.modify_channel_menu'),
      onClick: () => editChannel(),
    },
  ];

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
