import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import ChannelCategory from './ChannelCategory.js';
import ChannelWorkspaceEditor from 'app/scenes/Client/ChannelsBar/ChannelWorkspaceEditor';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import MediumPopupComponent from 'app/services/Modal/ModalManager';
import ChannelUI from './Channel';
import { ChannelType } from 'app/models/Channel';

type Props = {
  workspaceTitle: string;
  channels: { data: ChannelType }[];
};

export default class WorkspaceChannels extends React.Component<Props, {}> {
  node: any;

  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  addChannel() {
    return MediumPopupComponent.open(
      <ChannelWorkspaceEditor title={'scenes.app.channelsbar.channelsworkspace.create_channel'} />,
      {
        position: 'center',
        size: { width: '600px' },
      },
    );
  }

  render() {
    let channels;

    if (this.props.channels.length === 0) {
      channels = (
        <div className="channel_small_text">
          {Languages.t('scenes.app.channelsbar.channelsworkspace.no_channel')}
        </div>
      );
    } else {
      channels = this.props.channels.map(({ data }) => {
        return (
          <ChannelUI
            key={data.id}
            name={data.name || ''}
            icon={data.icon || ''}
            selected={false}
            muted={data.user_member?.notification_level === 'none'}
            favorite={data.user_member?.favorite || false}
            unreadMessages={false}
            visibility={data.visibility || 'public'}
            notifications={data.messages_count || 0}
            options={{}}
          />
        );
      });
    }
    return (
      <>
        <ChannelCategory
          refDraggable={(node: any) => {
            this.node = node;
          }}
          text={Languages.t(this.props.workspaceTitle)}
          onAdd={
            WorkspaceUserRights.hasWorkspacePrivilege() &&
            (() => {
              this.addChannel();
            })
          }
        />
        {channels}
      </>
    );
  }
}
