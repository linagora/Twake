import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import ChannelsService from 'services/channels/channels.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import UserService from 'services/user/user.js';
import Notifications from 'services/user/notifications.js';
import MenusManager from 'services/Menus/MenusManager.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import WorkspacesUser from 'services/workspaces/workspaces_users.js';
import Workspaces from 'services/workspaces/workspaces.js';
import UserListManager from 'components/UserListManager/UserListManager.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import ChannelUserAdd from './ChannelUserAdd.js';
import MediumPopupComponent from 'services/mediumPopupManager/mediumPopupManager.js';
import ChannelWorkspaceEditor from 'app/scenes/Client/ChannelsBar/ChannelWorkspaceEditor.js';

import ChannelUI from 'components/Leftbar/Channel/Channel.js';

export default class Channel extends Component {
  constructor(props) {
    super(props);

    this.props = props;

    this.state = {
      i18n: Languages,
      showAutoAdd: false,
    };

    Languages.addListener(this);
    ChannelsService.addListener(this);
    Notifications.addListener(this);

    if (this.props.direct && this.props.app) {
      this.mode = 'direct_app';
    } else if (this.props.direct) {
      this.mode = 'direct';
    } else if (this.props.app) {
      this.mode = 'app';
    } else {
      this.mode = 'workspace';
    }
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    ChannelsService.removeListener(this);
    Notifications.removeListener(this);
    if (this.listen_user_collection) {
      Collections.get('users').removeListener(this);
    }
  }
  listenUsers() {
    var users = this.props.users;
    users.forEach(id => {
      if (!Collections.get('users').find(id)) {
        UserService.asyncGet(id);
      }
    });
    if (!this.listen_user_collection) {
      Collections.get('users').addListener(this);
      this.listen_user_collection = true;
    }
    Collections.get('users').listenOnly(this, users);
  }
  removeChannel(chan) {
    Collections.get('channels').remove(chan, 'channels_' + Workspaces.currentWorkspaceId);
  }
  openMore(evt) {
    var channel = this.props.channel;
    var has_notification = (Notifications.notification_by_channel[channel.id] || {}).count > 0;

    var menu = [];

    menu.push({
      type: 'menu',
      text: Languages.t('scenes.apps.messages.left_bar.stream.notifications'),
      onClick: () => {
        Notifications.mute(channel, !channel._user_muted);
      },
      submenu: [
        {
          type: 'title',
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.title'),
        },
        {
          type: 'menu',
          icon: channel._user_muted === 0 ? 'check' : null,
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.all'),
          onClick: () => {
            Notifications.mute(channel, 0);
          },
        },
        {
          type: 'menu',
          icon: channel._user_muted === 1 ? 'check' : null,
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.mentions', [
            '@all',
            '@here',
            '@' + UserService.getCurrentUser().username,
          ]),
          onClick: () => {
            Notifications.mute(channel, 1);
          },
        },
        {
          type: 'menu',
          icon: channel._user_muted === 2 ? 'check' : null,
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.me', [
            '@' + UserService.getCurrentUser().username,
          ]),
          onClick: () => {
            Notifications.mute(channel, 2);
          },
        },
        {
          type: 'menu',
          icon: channel._user_muted === 3 ? 'check' : null,
          text: Languages.t('scenes.apps.messages.left_bar.stream.notifications.never'),
          onClick: () => {
            Notifications.mute(channel, 3);
          },
        },
      ],
    });

    if (has_notification) {
      menu.push({
        type: 'menu',
        text: Languages.t('scenes.app.channelsbar.read_sign', [], 'Marquer comme lu'),
        onClick: () => {
          Notifications.read(channel);
        },
      });
    } else {
      menu.push({
        type: 'menu',
        text: Languages.t('scenes.app.channelsbar.unread_sign', [], 'Marquer comme non lu'),
        onClick: () => {
          Notifications.unread(channel);
        },
      });
    }

    /**
     * Pinned channel preference
     */
    if (!channel.direct && !channel.app_id) {
      var pinned_channels_preferences =
        (
          ((Collections.get('users').find(UserService.getCurrentUserId()) || {})
            .workspaces_preferences || {})[Workspaces.currentWorkspaceId] || {}
        ).pinned_channels || {};
      if (!pinned_channels_preferences[channel.id]) {
        menu.push({
          type: 'menu',
          text: Languages.t('scenes.apps.messages.left_bar.stream.star'),
          onClick: () => {
            ChannelsService.pinChannel(channel, true);
          },
        });
      } else {
        menu.push({
          type: 'menu',
          text: Languages.t('scenes.apps.messages.left_bar.stream.unstar'),
          onClick: () => {
            ChannelsService.pinChannel(channel, false);
          },
        });
      }
    }

    if (!channel.direct && WorkspaceUserRights.hasWorkspacePrivilege()) {
      menu = menu.concat([
        { type: 'separator' },
        {
          type: 'menu',
          text: Languages.t('scenes.app.channelsbar.modify_channel_menu', 'Modifier la chaîne'),
          onClick: () => {
            MediumPopupComponent.open(
              <ChannelWorkspaceEditor
                title={
                  channel.private
                    ? 'scenes.app.channelsbar.modify_channel_title_private'
                    : 'scenes.app.channelsbar.modify_channel_title_public'
                }
                channel={channel}
              />,
              {
                position: 'center',
                size: { width: '600px' },
              },
            );
          },
        },
      ]);
      if (!channel.app_id) {
        menu = menu.concat([
          {
            type: 'menu',
            text: Languages.t(
              'scenes.app.channelsbar.extern_members_management_menu',
              [],
              'Gérer les membres externes',
            ),
            submenu_replace: true,
            submenu: [
              {
                type: 'title',
                text: Languages.t(
                  'scenes.app.channelsbar.extern_members_title',
                  [],
                  'Membres externes',
                ),
              },
              {
                type: 'react-element',
                reactElement: () => {
                  return <ChannelUserAdd channel={this.props.channel} />;
                },
              },
            ],
          },
        ]);
        menu.push({
          type: 'menu',
          className: 'error',
          text: Languages.t('scenes.app.channelsbar.channel_removing', [], 'Supprimer la chaîne'),
          onClick: () => {
            AlertManager.confirm(() => this.removeChannel(channel));
          },
        });
      }
    }

    var pos = window.getBoundingClientRect(this.node);
    pos.x = pos.x || pos.left;
    pos.y = pos.y || pos.top;
    MenusManager.openMenu(menu, { x: pos.x + pos.width, y: pos.y + pos.height / 2 }, 'right');
  }
  render() {
    var channel = this.props.channel;

    var name = '';
    var icon = '';
    var emoji = '';
    var users = [];

    if (this.mode == 'app') {
      name = Languages.t('app.name.' + this.props.app.simple_name, [], this.props.app.name);
      icon = WorkspacesApps.getAppIcon(this.props.app);
      if ((icon || '').indexOf('http') === 0) {
        emoji = icon;
        icon = '';
      }
    }

    if (this.mode == 'direct_app') {
      name = Languages.t('app.name.' + this.props.app.simple_name, [], this.props.app.name);
      emoji = this.props.app.icon_url;
    }

    if (this.mode == 'direct') {
      this.listenUsers();
      users = [];
      this.props.users.map(id => {
        var user = Collections.get('users').find(id);
        if (user) {
          users.push(user);
        }
      });

      var i_user = 0;
      name = (
        users.map(user => {
          i_user++;
          if (user) {
            return (
              (i_user > 1 ? ', ' : ' ') +
              (channel.members > 2
                ? user.firstname || user.username
                : UserService.getFullName(user))
            );
          }
        }) || []
      ).join('');
    }

    if (this.mode == 'workspace') {
      emoji = this.props.channel.icon;
      name = this.props.channel.name;
    }

    if (!name) {
      return '';
    }

    Notifications.listenOnly(this, ['channel_' + channel.id]);
    ChannelsService.updateBadge(channel);

    let new_content_count = (Notifications.notification_by_channel[channel.id] || {}).count || 0;
    let notifications_count = new_content_count;
    if (channel._user_muted >= 1 && !channel._user_last_quoted_message_id) {
      notifications_count = 0;
    }

    return (
      <ChannelUI
        refDiv={node => (this.node = node)}
        text={name}
        icon={icon}
        emoji={emoji}
        users={users}
        draggable={this.mode == 'workspace'}
        alinea={this.mode == 'workspace' && !this.props.pinned}
        appIndicator={this.mode == 'direct_app'}
        notMember={this.mode == 'direct' && this.props.outOfWorkspace}
        private={channel.private}
        muted={channel._user_muted >= 1}
        favorite={this.props.pinned}
        public={
          (
            (channel.ext_members || [])
              .filter(userId => WorkspacesUser.isExterne(userId))
              .filter(userId => channel.private || !WorkspacesUser.isAutoAddUser(userId)) || []
          ).length
        }
        hasNewContent={new_content_count}
        notifications={notifications_count}
        selected={ChannelsService.currentChannelFrontId == this.props.channel.front_id}
        dragData={this.props.channel}
        onClick={evt => ChannelsService.select(this.props.channel)}
        onClickMore={evt => {
          this.openMore(evt);
        }}
      />
    );
  }
}
