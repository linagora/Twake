import React, { Component } from 'react';
import Table from 'components/Table/Table';
import Collections from 'services/Collections/Collections.js';
import User from 'services/user/user.js';
import Icon from 'components/Icon/Icon.js';
import Menu from 'components/Menus/Menu.js';
import Languages from 'services/languages/languages.js';
import ChannelsService from 'services/channels/channels.js';
import WorkspacesUsers from 'services/workspaces/workspaces_users.js';
import popupManager from 'services/popupManager/popupManager.js';
import WorkspaceParameter from 'scenes/App/Popup/WorkspaceParameter/WorkspaceParameter.js';

import './ChannelMembers.scss';

import {
  ObjectModal,
  ObjectModalSubtitle,
  ObjectModalTitle,
  ObjectModalText,
} from 'components/ObjectModal/ObjectModal.js';

type Props = {
  membersIds: string[];
  channelTitle?: string;
  onClose: () => void;
  isPrivateChannel: boolean;
};

class ObjectModalMembers extends Component<Props> {
  constructor(props: Props) {
    super(props);

    Collections.get('users').addListener(this);
  }
  render() {
    return (
      <ObjectModal
        title={
          <ObjectModalTitle>
            {Languages.t('components.channelmembers.object_modal_members.popup_title', [
              this.props.channelTitle,
            ])}
          </ObjectModalTitle>
        }
        onClose={() => this.props.onClose()}
        noScrollBar={false}
      >
        <div className="channel_members_viewer">
          {!this.props.isPrivateChannel && (
            <ObjectModalSubtitle>
              {Languages.t('components.channelmembers.object_modal_members.public_channel_title', [
                Languages.t('components.channelmembers.object_modal_members.public'),
              ])}
            </ObjectModalSubtitle>
          )}
          {!this.props.isPrivateChannel && (
            <ObjectModalText className="small-top-margin">
              <div className="small-bottom-margin">
                {Languages.t(
                  'components.channelmembers.object_modal_members.public_channel_description',
                )}
              </div>
              {
                <a
                  href="#"
                  onClick={() => {
                    this.props.onClose();
                    popupManager.open(
                      <WorkspaceParameter initial_page={2} />,
                      true,
                      'workspace_parameters',
                    );
                  }}
                >
                  {Languages.t('components.channelmembers.object_modal_members.public_channe_link')}
                </a>
              }
            </ObjectModalText>
          )}
          {this.props.membersIds.length > 0 && (
            <Table
              resultsPerPage={10}
              column={[
                {
                  title: Languages.t('scenes.login.create_account.fullname'),
                  width: 200,
                  dataIndex: 'name',
                  render: (item: string, index: number) => {
                    let user = Collections.get('users').find(item);
                    if (!user) {
                      User.asyncGet(item);
                    }
                    const thumbnail = User.getThumbnail(user);
                    return (
                      !!user && (
                        <div
                          className="absolute_position"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <div
                            className="card user_image"
                            key={'user_' + index}
                            style={{
                              backgroundImage: "url('" + thumbnail + "')",
                            }}
                          />
                          <div key={'name_' + index} style={{ padding: '8px 0' }}>
                            {User.getFullName(user)}
                          </div>
                        </div>
                      )
                    );
                  },
                },
                {
                  title: Languages.t('components.reminder.by_email'),
                  dataIndex: 'name',
                  render: (item: string) => {
                    const user = Collections.get('users').find(item);
                    if (!user) {
                      User.asyncGet(item);
                    }
                    return (
                      !!user && (
                        <div
                          style={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <div>{user && user.email}</div>
                          {WorkspacesUsers.isExterne(user.id) && (
                            <div className="left-margin tag green">
                              {Languages.t('External member')}
                            </div>
                          )}
                        </div>
                      )
                    );
                  },
                },
                {
                  title: '',
                  dataIndex: 'action',
                  width: 30,
                  flexAlign: true,
                  render: (item: string) => {
                    const user = Collections.get('users').find(item);
                    if (!user) {
                      User.asyncGet(item);
                    }

                    return (
                      !!user && (
                        <Menu
                          menu={[
                            {
                              type: 'action',
                              text: Languages.t(
                                'components.channelmembers.object_modal_members.open_private_discussion',
                              ),
                              onClick: () => {
                                this.props.onClose();
                                if (!!user) return ChannelsService.openDiscussion([user.id]);
                              },
                            },
                          ]}
                          position="right"
                          className="options"
                        >
                          <Icon type="ellipsis-h" className="m-icon-small grey-icon" />
                        </Menu>
                      )
                    );
                  },
                },
              ]}
              onRequestMore={() =>
                new Promise(resolve => {
                  resolve(this.props.membersIds);
                })
              }
            />
          )}
        </div>
      </ObjectModal>
    );
  }
}

export default ObjectModalMembers;
