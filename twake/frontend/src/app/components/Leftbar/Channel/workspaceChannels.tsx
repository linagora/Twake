import React from 'react';

import Languages from 'services/languages/languages.js';
import ChannelCategory from './ChannelCategory.js';
import ChannelWorkspaceEditor from 'app/scenes/Client/ChannelsBar/ChannelWorkspaceEditor';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import MediumPopupComponent from 'app/services/Modal/ModalManager';
import ChannelMenu from './ChannelMenu';
import ChannelUI from './Channel';
import { ChannelResource, ChannelType } from 'app/models/Channel';
import RouterService from 'services/RouterServices';

type Props = {
  workspaceTitle: string;
  channels: ChannelResource[];
};

export default (props: Props) => {
  const menu = (channel: ChannelType) => {
    return <ChannelMenu channel={channel} />;
  };

  const addChannel = () => {
    return MediumPopupComponent.open(
      <ChannelWorkspaceEditor title={'scenes.app.channelsbar.channelsworkspace.create_channel'} />,
      {
        position: 'center',
        size: { width: '600px' },
      },
    );
  };

  let channels;

  if (props.channels.length === 0) {
    channels = (
      <div className="channel_small_text">
        {Languages.t('scenes.app.channelsbar.channelsworkspace.no_channel')}
      </div>
    );
  } else {
    channels = props.channels.map(({ data, key }) => {
      return (
        <ChannelUI
          key={key}
          name={data.name || ''}
          icon={data.icon || ''}
          muted={data.user_member?.notification_level === 'none'}
          favorite={data.user_member?.favorite || false}
          unreadMessages={false}
          visibility={data.visibility || 'public'}
          notifications={data.messages_count || 0}
          menu={menu(data)}
          id={data.id}
        />
      );
    });
  }
  return (
    <>
      <ChannelCategory text={Languages.t(props.workspaceTitle)} onAdd={() => addChannel()} />
      {channels}
    </>
  );
};
