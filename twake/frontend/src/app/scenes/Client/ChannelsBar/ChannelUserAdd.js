import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import MenusManager from 'services/Menus/MenusManager.js';
import WorkspacesUser from 'services/workspaces/workspaces_users.js';
import Workspaces from 'services/workspaces/workspaces.js';
import UserListManager from 'components/UserListManager/UserListManager.js';
import Switch from 'components/Inputs/Switch.js';

export default class ChannelUserAdd extends Component {
  constructor(props) {
    super(props);

    this.props = props;

    this.state = {
      i18n: Languages,
      showAutoAdd: false,
    };
  }
  componentWillUnmount() {}
  render() {
    var channel = this.props.channel;
    var userWexterneId = (
      (channel.ext_members || [])
        .concat(Object.keys(WorkspacesUser.users_by_workspace[Workspaces.currentWorkspaceId]))
        .filter(function (value, index, self) {
          return self.indexOf(value) === index;
        })
        .filter(userId => WorkspacesUser.isExterne(userId))
        .filter(userId => WorkspacesUser.isAutoAddUser(userId)) || []
    ).map(id => {
      return { id: id };
    });
    return (
      <div className="channelUserAdd">
        <div style={{ margin: '0px -8px' }}>
          {!channel.private && this.state.showAutoAdd && (
            <div className="" style={{ opacity: 0.4 }}>
              <div className="menu-text">
                {Languages.t(
                  'scenes.app.channelsbar.invite_autoadd',
                  [],
                  'Invité ajouté automatiquement',
                )}
              </div>
              <UserListManager users={userWexterneId} readOnly />
            </div>
          )}
          <UserListManager
            users={(
              (channel.ext_members || [])
                .filter(userId => WorkspacesUser.isExterne(userId))
                .filter(userId => channel.private || !WorkspacesUser.isAutoAddUser(userId)) || []
            ).map(id => {
              return { id: id };
            })}
            hideUsersIds={
              channel.private
                ? []
                : (channel.members || []).concat(
                    (channel.ext_members || []).filter(userId =>
                      WorkspacesUser.isAutoAddUser(userId),
                    ) || [],
                  )
            }
            scope="group"
            allowMails
            onCancel={() => {
              MenusManager.closeMenu();
            }}
            onChange={ids_mails => {
              channel.ext_members = ids_mails;
              Collections.get('channels').save(
                channel,
                'channels_' + Workspaces.currentWorkspaceId,
              );
              MenusManager.closeMenu();
            }}
          />
          <div className="menu-text">
            {Languages.t(
              'scenes.app.channelsbar.invated_access_right',
              [],
              'Vous pouvez inviter des utilisateurs externe à votre espace de travail.',
            )}
          </div>
          {!channel.private && userWexterneId.length > 0 && (
            <div className="menu-text flexDiv">
              <Switch
                small
                value={this.state.showAutoAdd}
                onChange={state => {
                  this.setState({ showAutoAdd: state });
                }}
              />
              <div className="flex1">
                affichez les invités automatique ({userWexterneId.length})
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
