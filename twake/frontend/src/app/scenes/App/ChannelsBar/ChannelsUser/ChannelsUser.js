import React, {Component} from 'react';

import Languages from 'services/languages/languages.js';
import Emojione from 'components/Emojione/Emojione.js';
import Workspaces from 'services/workspaces/workspaces.js';
import Collections from 'services/Collections/Collections.js';
import User from 'services/user/user.js';
import UserService from 'services/user/user.js';
import WorkspacesUsers from 'services/workspaces/workspaces_users.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import PopupManager from 'services/popupManager/popupManager.js';
import popupManager from 'services/popupManager/popupManager.js';
import ChannelCategory from 'components/Leftbar/Channel/ChannelCategory.js';
import ChannelUI from 'components/Leftbar/Channel/Channel.js';
import Channel from '../Channel.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import MenusManager from 'services/Menus/MenusManager.js';
import AddUser from 'scenes/App/Popup/AddUser/AddUser.js';
import UserListManager from 'components/UserListManager/UserListManager.js';
import ChannelsService from 'services/channels/channels.js';
import WorkspaceParameter from 'scenes/App/Popup/WorkspaceParameter/WorkspaceParameter.js';

export default class ChannelsUser extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
      workspaces: Workspaces,
      workspaces_users: WorkspacesUsers,
      workspaces_apps: WorkspacesApps,
      users_picker_value: [],
    };

    Collections.get('channels').addSource(
      {
        http_base_url: 'channels/direct_messages',
        http_options: {},
        websockets: [
          {
            uri: 'channels/direct_messages/' + User.getCurrentUserId(),
            options: { type: 'channels/direct_messages' },
          },
        ],
      },
      'direct_messages_' + User.getCurrentUserId(),
    );

    Languages.addListener(this);
    Workspaces.addListener(this);
    WorkspacesUsers.addListener(this);
    Collections.get('workspaces').addListener(this);
    Collections.get('channels').addListener(this);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Workspaces.removeListener(this);
    WorkspacesUsers.removeListener(this);
    Collections.get('workspaces').removeListener(this);

    Collections.get('channels').removeListener(this);
    Collections.get('channels').removeSource('direct_messages_' + User.getCurrentUserId());
  }

  getSortingValue(channel) {
    var val = (new Date().getTime() / 1000 - channel.last_activity) / (60 * 60 * 12);
    if (this.membersInWorkspace(channel.members || [])) {
      val = val - 1;
    }
    return 0 - val;
  }
  membersInWorkspace(members) {
    var yes = true;
    members.forEach(member_id => {
      yes =
        yes &&
        !!this.state.workspaces_users.getUsersByWorkspace(Workspaces.currentWorkspaceId)[member_id];
    });
    return yes;
  }
  openConv(evt) {
    var new_conv_menu = [
      {
        type: 'title',
        text: Languages.t(
          'scenes.app.channelsbar.channelsuser.new_private_discussion',
          [],
          'Nouvelle discussion privée',
        ),
      },
      {
        type: 'react-element',
        reactElement: (
          <div style={{ margin: '0 -16px' }}>
            <UserListManager
              users={[]}
              canRemoveMyself
              scope="all"
              continueText="Continuer"
              onChange={ids => {
                ChannelsService.openDiscussion(ids);
              }}
            />
          </div>
        ),
        /*<UserPicker title="Select recipients" value={this.state.users_picker_value} onChange={(list)=>this.setState({users_picker_value: list})}/>*/
      },
    ];

    if (WorkspaceUserRights.hasWorkspacePrivilege()) {
      new_conv_menu = new_conv_menu.concat([
        { type: 'separator' },
        {
          type: 'menu',
          icon: 'plus',
          text: Languages.t(
            'scenes.app.channelsbar.channelsuser.invite_collaborators',
            [],
            'Inviter des collaborateurs',
          ),
          onClick: () => {
            PopupManager.open(<AddUser standalone />);
          },
        },
      ]);
    }

    var pos = window.getBoundingClientRect(this.add_node);
    pos.x = pos.x || pos.left;
    pos.y = pos.y || pos.top;
    MenusManager.openMenu(new_conv_menu, { x: pos.x + pos.width, y: pos.y }, 'right');
  }
  render() {
    if (
      !Collections.get('channels').did_load_first_time['channels_' + Workspaces.currentWorkspaceId]
    ) {
      return (
        <div className="apps_channels loading_render">
          <ChannelCategory text="" />
          <ChannelUI text="" />
          <ChannelUI text="" />
          <ChannelUI text="" />
        </div>
      );
    }

    var workspace = Collections.get('workspaces').known_objects_by_id[
      Workspaces.currentWorkspaceId
    ];
    var all_direct_channels = Collections.get('channels').known_objects_by_front_id;

    var members_already_in_last_discussions = [];
    all_direct_channels = Object.keys(all_direct_channels)
      .map(fid => {
        if (Collections.get('channels').known_objects_by_front_id[fid].members_count == 2) {
          members_already_in_last_discussions = members_already_in_last_discussions.concat(
            Collections.get('channels').known_objects_by_front_id[fid].members,
          );
        }
        return Collections.get('channels').known_objects_by_front_id[fid];
      })
      .filter(channel => channel.direct)
      .filter(
        channel =>
          channel.members &&
          Object.values(channel.members || []).length &&
          Object.values(channel.members || [])
            .concat(Object.values(channel.ext_members || []))
            .indexOf(User.getCurrentUserId()) >= 0,
      );

    Object.keys(
      this.state.workspaces_users.getUsersByWorkspace(Workspaces.currentWorkspaceId) || {},
    )
      .filter(item => {
        var member = this.state.workspaces_users.getUsersByWorkspace(Workspaces.currentWorkspaceId)[
          item
        ];
        if (WorkspaceUserRights.isInviteChannelOnly() && member.autoAddExterne) {
          return false;
        }
        return true;
      })
      .filter(member => WorkspacesUsers.canShowUserInWorkspaceList(member))
      .map(user_id => {
        if (
          members_already_in_last_discussions.indexOf(user_id) <
          0 /* && user_id != UserService.getCurrentUserId() */
        ) {
          var false_channel = {};
          false_channel.members = [user_id, UserService.getCurrentUserId()];
          false_channel.direct = true;
          false_channel.members_count = 2;
          false_channel.last_activity = this.state.workspaces_users.users_by_workspace[
            Workspaces.currentWorkspaceId
          ][user_id].last_access;
          false_channel.front_id = user_id;
          all_direct_channels.push(false_channel);
        }
      });

    return (
      <div className="users_channels">
        <ChannelCategory
          refAdd={node => (this.add_node = node)}
          text={Languages.t(
            'scenes.app.channelsbar.channelsuser.private_messages',
            [],
            'Messages directs',
          )}
          onAdd={evt => {
            this.openConv(evt);
          }}
        />

        <div>
          {all_direct_channels
            .filter(
              channel =>
                !channel.app_id ||
                (WorkspacesApps.getApps()
                  .map(app => app.id)
                  .indexOf(channel.app_id) < 0 &&
                  channel.app_group_id == Workspaces.currentGroupId),
            )
            .concat(
              WorkspacesApps.getApps()
                .filter(app => (app.display || {}).member_app)
                .map(app => {
                  var fid =
                    Workspaces.currentGroupId + '_app_' + app.id + '_' + User.getCurrentUserId();
                  return (
                    Collections.get('channels').known_objects_by_front_id[fid] || {
                      front_id: fid,
                      app_id: app.id,
                      app_bot_identifier: Workspaces.currentGroupId + '_app_' + app.id,
                      app: app,
                      last_activity: new Date().getTime() / 1000,
                    }
                  );
                }),
            )
            .sort((a, b) => this.getSortingValue(b) - this.getSortingValue(a))
            .map(channel => {
              var users = [];
              (channel.members || []).forEach(id => {
                if (id != User.getCurrentUserId() || channel.members.length == 1) {
                  users.push(id);
                }
              });
              return (
                <Channel
                  key={channel.front_id}
                  channel={channel}
                  users={users}
                  app={(channel.app || {}).id ? channel.app : false}
                  direct
                  outOfWorkspace={channel.app_id || !this.membersInWorkspace(channel.members)}
                />
              );
            })}

          {!Collections.get('channels').loading_first_get && all_direct_channels.length == 0 && (
            <div
              className="channel_small_text"
              onClick={() => {
                popupManager.open(
                  <WorkspaceParameter initial_page={2} />,
                  true,
                  'workspace_parameters',
                );
              }}
            >
              {Languages.t(
                'scenes.app.channelsbar.channelsuser.no_private_message_invite_collaboraters',
                [],
                'Aucun message privé, invitez vos collaborateurs !',
              )}{' '}
              <Emojione type=":smiley:" />
            </div>
          )}
        </div>
      </div>
    );
  }
}
