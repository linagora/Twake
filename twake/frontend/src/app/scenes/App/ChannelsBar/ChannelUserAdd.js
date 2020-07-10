<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

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
<<<<<<< HEAD
        .filter(function (value, index, self) {
=======
        .filter(function(value, index, self) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
<<<<<<< HEAD
                  'Invité ajouté automatiquement'
=======
                  'Invité ajouté automatiquement',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                )}
              </div>
              <UserListManager users={userWexterneId} scope="all" readOnly />
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
<<<<<<< HEAD
                      WorkspacesUser.isAutoAddUser(userId)
                    ) || []
=======
                      WorkspacesUser.isAutoAddUser(userId),
                    ) || [],
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                  )
            }
            scope="all"
            allowMails
            onCancel={() => {
              MenusManager.closeMenu();
            }}
            onChange={ids_mails => {
              channel.ext_members = ids_mails;
              Collections.get('channels').save(
                channel,
<<<<<<< HEAD
                'channels_' + Workspaces.currentWorkspaceId
=======
                'channels_' + Workspaces.currentWorkspaceId,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              );
              MenusManager.closeMenu();
            }}
          />
          <div className="menu-text">
            {Languages.t(
              'scenes.app.channelsbar.invated_access_right',
              [],
<<<<<<< HEAD
              'Vous pouvez inviter des utilisateurs externe à votre espace de travail.'
=======
              'Vous pouvez inviter des utilisateurs externe à votre espace de travail.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
