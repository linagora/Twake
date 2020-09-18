import React from 'react';
import Observable from 'services/observable.js';
import CurrentUser from 'services/user/current_user.js';
import UserService from 'services/user/user.js';
import Api from 'services/api.js';
import Workspaces from 'services/workspaces/workspaces.js';
import Collections from 'services/Collections/Collections.js';
import LocalStorage from 'services/localStorage.js';
import Notifications from 'services/user/notifications.js';
import WindowService from 'services/utils/window.js';
import emojione from 'emojione';
import Number from 'services/utils/Numbers.js';
import MenusManager from 'services/Menus/MenusManager.js';
import Globals from 'services/Globals.js';

class Channels extends Observable {
  constructor() {
    super();
    this.setObservableName('channels');

    this.state = {
      channels_repository: Collections.get('channels'),
    };
    Collections.get('channels').addListener(this);

    Globals.window.channel_service = this;

    this.currentSideChannelFrontId = null;
    this.currentSideChannelFrontIdByWorkspace = {};

    this.currentSideChannelOptions = {};
    this.currentChannelFrontId = null;
    this.currentChannelFrontIdByWorkspace = {};

    this.reached_initial_channel = false;
    this.old_channel_state = {};
    this.url_values = WindowService.getInfoFromUrl() || {};

    this.current_tab_id = null;
    this.current_tab_id_by_channel_id = {};

    this.channel_front_read_state = {};

    var that = this;
    Globals.window.addEventListener('focus', function (e) {
      that.readChannelIfNeeded(
        Collections.get('channels').findByFrontId(that.currentChannelFrontId),
      );
    });
  }

  setState() {
    this.initSelection();
  }

  selectTab(tab) {
    var channel = Collections.get('channels').findByFrontId(this.currentChannelFrontId);
    if (channel) {
      this.current_tab_id_by_channel_id[channel.id] = tab ? tab.id : null;
    }
    this.current_tab_id = tab ? tab.id : null;
    this.notify();
  }

  select(channel, side = false, sideOptions = {}) {
    if (side) {
      if (
        this.currentSideChannelFrontId != channel.front_id &&
        channel.id &&
        !channel.application
      ) {
        this.readChannelIfNeeded(channel);
        delete Notifications.marked_as_unread[channel.id];
      }

      this.currentSideChannelOptions = sideOptions;
      this.currentSideChannelFrontId = channel.front_id;
      this.currentSideChannelFrontIdByWorkspace[Workspaces.currentWorkspaceId] = channel.front_id;
    } else {
      if (channel) {
        this.channel_front_read_state[channel.id] = channel._user_last_access;
      }

      if (channel && channel.direct && !channel.id) {
        this.openDiscussion(channel.members);
      }

      channel = Collections.get('channels').findByFrontId(channel.front_id);

      if (!channel) {
        return;
      }

      this.reached_initial_channel = true;

      if (this.currentChannelFrontId != channel.front_id && channel.id && !channel.application) {
        this.readChannelIfNeeded(channel);
        delete Notifications.marked_as_unread[channel.id];
      }

      if (this.currentChannelFrontId != channel.front_id) {
        //Change url
        this.updateURL(channel);
      }

      (channel.tabs || []).forEach(tab => {
        Collections.get('channel_tabs').completeObject(tab);
      });
      Collections.get('channel_tabs').notify();

      this.currentChannelFrontId = channel.front_id;
      this.currentChannelFrontIdByWorkspace[Workspaces.currentWorkspaceId] = channel.front_id;

      this.current_tab_id = this.current_tab_id_by_channel_id[channel.id] || null;

      LocalStorage.setItem('autoload_channel', {
        front_id: this.currentChannelFrontId,
        type: channel.type,
        id: channel.id,
      });
    }
    this.notify();

    MenusManager.closeMenu();
  }

  initSelection() {
    var currentWorkspaceId = Workspaces.currentWorkspaceId;
    var currentGroupId = Workspaces.currentGroupId;

    var find = Collections.get('channels').findByFrontId(this.currentChannelFrontId);
    if (
      this.currentChannelFrontId &&
      find &&
      (find.original_workspace == currentWorkspaceId || find.direct)
    ) {
      return;
    }

    LocalStorage.getItem('autoload_channel', local_data => {
      var channel =
        (this.url_values.channel_id ? { id: this.url_values.channel_id } : null) ||
        local_data ||
        {};
      if (!channel || !(channel || {}).id) {
        this.reached_initial_channel = true;
      } else {
        var channel_ent =
          Collections.get('channels').findByFrontId(channel.front_id) ||
          Collections.get('channels').find(channel.id);
        if (
          channel_ent &&
          (channel_ent.original_workspace == currentWorkspaceId || channel_ent.direct)
        ) {
          this.select(Collections.get('channels').findByFrontId(channel_ent.front_id));
          return;
        }
      }

      if (!this.reached_initial_channel) {
        return null;
      }

      if (
        !Collections.get('channels').did_load_first_time[
          'channels_' + Workspaces.currentWorkspaceId
        ]
      ) {
        return;
      }

      //Select previously selected channel
      if (
        Collections.get('channels').findByFrontId(
          this.currentSideChannelFrontIdByWorkspace[currentWorkspaceId],
        )
      ) {
        this.select(
          { front_id: this.currentSideChannelFrontIdByWorkspace[currentWorkspaceId] },
          true,
        );
      }

      //Select previously selected channel
      if (
        Collections.get('channels').findByFrontId(
          this.currentChannelFrontIdByWorkspace[currentWorkspaceId],
        )
      ) {
        this.select({ front_id: this.currentChannelFrontIdByWorkspace[currentWorkspaceId] });
        return;
      }

      //Select workspace channel
      var candidates = Collections.get('channels').findBy(
        { original_workspace: currentWorkspaceId, application: false },
        { channel_group_name: 'ASC' },
      );
      if (candidates.length > 0) {
        this.select(candidates[0]);
        return;
      }

      //Select private messages
      var candidates = Collections.get('channels').findBy({ direct: true });
      if (candidates.length > 0) {
        this.select(candidates[0]);
        return;
      }

      return null;
    });
  }

  saveTab(channel_id, app_id, name, configuration, id) {
    if (!name && !configuration) {
      return;
    }

    if (Globals.window.mixpanel_enabled)
      Globals.window.mixpanel.track(Globals.window.mixpanel_prefix + 'Update Tab');

    var channel = Collections.get('channels').find(channel_id);
    if (!channel) {
      return;
    }

    var tab = {
      app_id: app_id,
      id: id,
      front_id: Number.unid(),
    };

    if (name) {
      tab.name = name;
      channel._once_save_tab = tab;
    }

    if (configuration) {
      tab.configuration = configuration;
      channel._once_save_tab_config = tab;
    }

    Collections.get('channels').completeObject(channel, channel.front_id);
    Collections.get('channels').save(channel, 'channels_' + Workspaces.currentWorkspaceId, () => {
      var channel = Collections.get('channels').find(channel_id);
      (channel.tabs || []).forEach(tab => {
        Collections.get('channel_tabs').completeObject(tab);
      });
      Collections.get('channel_tabs').notify();
    });
  }

  removeTab(channel_id, app_id, id) {
    var channel = Collections.get('channels').find(channel_id);
    if (!channel) {
      return;
    }

    var tab = {
      app_id: app_id,
      id: id,
      front_id: Number.unid(),
    };

    channel._once_remove_tab = tab;

    Collections.get('channels').save(channel, 'channels_' + Workspaces.currentWorkspaceId, () => {
      var channel = Collections.get('channels').find(channel_id);
      (channel.tabs || []).forEach(tab => {
        Collections.get('channel_tabs').completeObject(tab);
      });
      Collections.get('channel_tabs').notify();
    });
  }

  pinChannel(channel, value) {
    var preferences = CurrentUser.get().workspaces_preferences;

    if (preferences.length && preferences.length == 0) {
      preferences = new Object();
    }
    if (!preferences) {
      preferences = new Object();
    }
    if (!preferences[channel.original_workspace]) {
      preferences[channel.original_workspace] = {};
    }
    if (!preferences[channel.original_workspace].pinned_channels) {
      preferences[channel.original_workspace].pinned_channels = {};
    }
    preferences = Object.assign({}, preferences);

    if (value === undefined) {
      value = true;
    }

    //Deleted channel !
    Object.keys(preferences[channel.original_workspace].pinned_channels).forEach(id => {
      if (!Collections.get('channels').find(id)) {
        delete preferences[channel.original_workspace].pinned_channels[id];
      }
    });

    //No changes
    if (
      (value && preferences[channel.original_workspace].pinned_channels[channel.id]) ||
      (!value && !preferences[channel.original_workspace].pinned_channels[channel.id])
    ) {
      return;
    }

    if (!value) {
      delete preferences[channel.original_workspace].pinned_channels[channel.id];
    } else {
      preferences[channel.original_workspace].pinned_channels[channel.id] = true;
      preferences[channel.original_workspace].pinned_channels = Object.assign(
        {},
        preferences[channel.original_workspace].pinned_channels,
      );
    }

    CurrentUser.updateWorkspacesPreferences(preferences);

    this.notify();
  }

  updateBadge(channel) {
    var old_state = this.old_channel_state[channel.id];
    var ui = channel._user_last_message_increment || 0;
    if (ui === undefined) {
      channel._user_last_message_increment = channel.messages_increment;
      ui = channel._user_last_message_increment || 0;
    }
    var state = channel.messages_increment - ui;
    if (!channel._user_last_quoted_message_id && channel._user_muted >= 1) {
      state = 0;
    }
    if (state == old_state) {
      return;
    }
    this.old_channel_state[channel.id] = state;
    Notifications.updateBadge('channel', channel.id, state);
  }

  readChannelIfNeeded(channel) {
    if (!channel) {
      return;
    }
    var messages = Collections.get('messages').findBy({ channel_id: channel.id });
    if (messages.length > 0) {
      Notifications.read(channel);
    }
  }

  incrementChannel(channel) {
    channel._user_last_message_increment = channel._user_last_message_increment || 0;
    channel._user_last_message_increment++;
    channel.messages_increment++;
    channel.last_activity = new Date().getTime() / 1000;
    channel._user_last_access = new Date().getTime() / 1000;
    Collections.get('channels').completeObject(channel);
  }

  updateTitle(channel) {
    if (!channel) {
      channel = Collections.get('channels').findByFrontId(this.currentChannelFrontId);
    }

    if (this._title_timeout) clearTimeout(this._title_timeout);

    if (!channel) {
      return;
    }
    if (channel && channel.icon) {
      var icon_url = emojione.toImage(channel.icon);
      icon_url = icon_url.replace(/.*src=("|')(.*\.png).*/, '$2');
      WindowService.setTitle(channel.name, icon_url);
    } else if (channel && channel.application && channel.app_id) {
      //Workspace chan

      var application = Collections.get('applications').find(channel.app_id);

      if (application) {
        WindowService.setTitle(application.name, application.icon_url);
      }
    } else if (channel.direct) {
      var name = [];
      var user_icon = undefined;
      ((channel || {}).members || []).forEach(id => {
        if (channel.members.length == 1 || id != CurrentUser.get().id) {
          var user = Collections.get('users').find(id);
          if (user) {
            name.push(UserService.getFullName(user));
            if (!user_icon) {
              user_icon = UserService.getThumbnail(user);
            }
          }
        }
      });
      if (name.length == 0) {
        this._title_timeout = setTimeout(() => {
          this.updateTitle();
        }, 1000);
        return false;
      }
      name = name.join(', ');
      WindowService.setTitle(name, user_icon);
    } else {
      WindowService.setTitle();
    }
    return true;
  }

  getURL(channel, messageId) {
    var url = '/';

    channel = channel.id ? channel : Collections.get('channels').find(channel);

    if (this._url_timeout) clearTimeout(this._title_timeout);

    var workspace = Collections.get('workspaces').find(Workspaces.currentWorkspaceId);
    var group = Collections.get('groups').find(Workspaces.currentGroupId);

    if (!channel) {
      return false;
    }
    if (!channel.id) {
      return false;
    }
    if (channel && channel.icon) {
      //Workspace chan

      url = WindowService.nameToUrl(channel.name);
      url =
        '/' +
        WindowService.nameToUrl(group.name.toLocaleLowerCase()) +
        '-' +
        WindowService.nameToUrl(workspace.name.toLocaleLowerCase()) +
        '/' +
        url +
        '-' +
        WindowService.reduceUUID4(workspace.id) +
        '-' +
        WindowService.reduceUUID4(channel.id) +
        '-' +
        (messageId ? WindowService.reduceUUID4(messageId || '') : '');
    } else if (channel && channel.application && channel.app_id) {
      //Workspace chan

      var application = Collections.get('applications').find(channel.app_id);

      if (!application) {
        return;
      }

      url = WindowService.nameToUrl(application.name);
      url =
        '/' +
        WindowService.nameToUrl(group.name.toLocaleLowerCase()) +
        '-' +
        WindowService.nameToUrl(workspace.name.toLocaleLowerCase()) +
        '/' +
        url +
        '-' +
        WindowService.reduceUUID4(workspace.id) +
        '-' +
        WindowService.reduceUUID4(channel.id);
    } else if (channel.direct) {
      //Private chan
      var name = [];
      ((channel || {}).members || []).forEach(id => {
        if (channel.members.length == 1 || id != CurrentUser.get().id) {
          var user = Collections.get('users').find(id);
          if (user) {
            name.push('@' + user.username);
          }
        }
      });
      if (name.length == 0) {
        return false;
      }
      name = name.join('+');
      url =
        '/private/' +
        WindowService.nameToUrl(name) +
        '-' +
        WindowService.reduceUUID4(channel.id) +
        '-' +
        (messageId ? WindowService.reduceUUID4(messageId || '') : '');
    }
    return url;
  }

  updateURL(channel) {
    const url = this.getURL(channel, this.url_values.message);
    if (!url) {
      this._url_timeout = setTimeout(() => {
        this.updateURL();
      }, 1000);
    }
    WindowService.setUrl(url);
    this.updateTitle(channel);
  }

  search(query, callback) {
    if (query.length == 0) {
      callback([]);
      return;
    }

    //First search with known data
    var res = [];
    Collections.get('channels')
      .findBy({ direct: false, app_id: false, original_workspace: Workspaces.currentWorkspaceId })
      .forEach(channel => {
        if (channel.name.toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) >= 0) {
          res.push(channel);
        }
        if (res.length > 30) {
          return false;
        }
      });

    callback(res);
  }

  openDiscussion(_members) {
    MenusManager.closeMenu();

    var members = [];
    if (_members) {
      members = _members;
    } else {
      members = this.state.users_picker_value;
      members = members.map(item => item.id);
    }

    if (members.indexOf(UserService.getCurrentUserId()) < 0) {
      members.push(UserService.getCurrentUserId());
    }
    Api.post('channels/direct_messages/save', { object: { members: members } }, res => {
      if (res.data && res.data.object) {
        Collections.get('channels').save(
          res.data.object,
          'direct_messages_' + UserService.getCurrentUserId(),
        );
        this.select(res.data.object);
      }
    });
  }

  openDiscussionWithApp(channel) {
    Api.post(
      'channels/direct_messages/save',
      {
        object: {
          front_id: channel.front_id,
          app_id: channel.app.id,
          group_id: Workspaces.currentGroupId,
        },
      },
      res => {
        if (res.data && res.data.object) {
          Collections.get('channels').save(
            res.data.object,
            'direct_messages_' + UserService.getCurrentUserId(),
          );
          this.select(res.data.object);
        }
      },
    );
  }

  getChannelForApp(app_id, workspace_id) {
    return Collections.get('channels').findBy({
      application: true,
      direct: false,
      app_id: app_id,
      original_workspace: workspace_id,
    })[0];
  }

  markFrontAsRead(channel_id, date = undefined) {
    this.channel_front_read_state[channel_id] = date || new Date().getTime() / 1000;
    this.notify();
  }
}

Globals.services.channelsService = Globals.services.channelsService || new Channels();
export default Globals.services.channelsService;
