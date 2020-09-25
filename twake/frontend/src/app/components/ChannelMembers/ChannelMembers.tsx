import React, { Component } from 'react';
import Collections from 'services/Collections/Collections.js';
import User from 'services/user/user.js';
import './ChannelMembers.scss';
import Languages from 'services/languages/languages.js';
import Button from 'components/Buttons/Button.js';
import Tooltip from 'components/Tooltip/Tooltip.js';
import MediumPopupManager from 'services/mediumPopupManager/mediumPopupManager.js';
import WorkspacesUsers from 'services/workspaces/workspaces_users.js';
import ObjectModalMembers from './ObjectModalMembers';
import popupManager from 'services/popupManager/popupManager.js';
import WorkspaceParameter from 'scenes/App/Popup/WorkspaceParameter/WorkspaceParameter.js';

type Props = {
  channel: {
    id: string;
    members: string[];
    ext_members: string[];
    private: boolean;
    name: string;
  };
};

type State = {
  usersThumbnail: string[];
};

export default class ChannelMembers extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      usersThumbnail: [],
    };

    Collections.get('users').addListener(this);
  }

  render() {
    const maxHeads: number = 10;
    const maxMembersInTooltip: number = 10;

    let channelSpecificMembers: string[] = [];
    let isPrivateChannel: boolean = this.props.channel.private;

    channelSpecificMembers = isPrivateChannel
      ? channelSpecificMembers.concat(this.props.channel.members)
      : channelSpecificMembers;

    channelSpecificMembers = channelSpecificMembers.concat(
      this.props.channel.ext_members
        .filter(item => this.props.channel.members.indexOf(item) < 0)
        .filter(userId => WorkspacesUsers.isExterne(userId)) || [],
      //.filter(userId => isPrivateChannel || !WorkspacesUsers.isAutoAddUser(userId)) || [],
    );
    channelSpecificMembers = channelSpecificMembers.filter(
      (elem, index, self) => elem !== undefined && index === self.indexOf(elem),
    );

    return (
      <div className="channel_members_container">
        <div className="card_container">
          {!isPrivateChannel && (
            <Tooltip
              className="card user_image"
              position="bottom"
              tooltip={
                <div className="tooltip-container">
                  {Languages.t(
                    'components.channelmembers.object_modal_members.public_channel_description',
                  )}
                </div>
              }
            >
              <div
                className="card count_user small-right-margin"
                style={{
                  cursor: 'pointer',
                }}
                onClick={() => {
                  popupManager.open(
                    <WorkspaceParameter initial_page={2} />,
                    true,
                    'workspace_parameters',
                  );
                }}
              >
                W
              </div>
            </Tooltip>
          )}

          {channelSpecificMembers.length > 0 && (
            <div className="thumbnails">
              {channelSpecificMembers.slice(0, maxHeads).map((item: string, index: number) => {
                let user = Collections.get('users').find(item);
                if (!user) {
                  User.asyncGet(item);
                }
                let thumbnail = User.getThumbnail(user);

                return (
                  user && (
                    <Tooltip
                      className="card user_image"
                      position="bottom"
                      tooltip={
                        <div className="tooltip-container">
                          {<span className="text-el">{User.getFullName(user)}</span>}
                        </div>
                      }
                    >
                      <div
                        key={'user_' + index}
                        className="card user_image"
                        style={{ backgroundImage: "url('" + thumbnail + "')" }}
                      />
                    </Tooltip>
                  )
                );
              })}
            </div>
          )}
          {channelSpecificMembers.length > maxHeads && (
            <div>
              <Tooltip
                position="bottom"
                tooltip={
                  <div className="tooltip-container">
                    {channelSpecificMembers
                      .slice(maxHeads, maxHeads + maxMembersInTooltip)
                      .map((item: string) => {
                        const user = Collections.get('users').find(item);
                        if (!user) {
                          User.asyncGet(item);
                        }
                        return <span className="text-el">{User.getFullName(user)}</span>;
                      })}
                    {channelSpecificMembers.length > maxHeads + maxMembersInTooltip && (
                      <span>
                        {Languages.t('scenes.app.popup.channelmembers.current_channel_members', [
                          channelSpecificMembers.length - (maxHeads + maxMembersInTooltip),
                        ])}
                      </span>
                    )}
                  </div>
                }
              >
                <div className="card count_user">+{channelSpecificMembers.length - maxHeads}</div>
              </Tooltip>
            </div>
          )}
        </div>
        <div>
          <Button
            onClick={() => {
              MediumPopupManager.open(
                <ObjectModalMembers
                  channelTitle={this.props.channel.name}
                  membersIds={channelSpecificMembers}
                  onClose={() => MediumPopupManager.closeAll()}
                  isPrivateChannel={isPrivateChannel}
                />,
                {
                  position: 'center',
                  size: {
                    width: '600px',
                  },
                },
              );
            }}
            className="small right-margin rounded"
          >
            {Languages.t('scenes.apps.parameters.workspace_sections.members')}
          </Button>
        </div>
      </div>
    );
  }
}
