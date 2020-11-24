import Observable from 'app/services/Depreciated/observable.js';
import CurrentUser from 'services/user/current_user.js';
import UserService from 'services/user/user.js';
import Api from 'services/Api';
import Workspaces from 'services/workspaces/workspaces.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import LocalStorage from 'services/localStorage.js';
import Notifications from 'services/user/notifications.js';
import WindowService from 'services/utils/window.js';
import emojione from 'emojione';
import Number from 'services/utils/Numbers.js';
import MenusManager from 'services/Menus/MenusManager.js';
import Globals from 'services/Globals.js';
import RouterServices from 'app/services/RouterService';

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

      RouterServices.history.push(RouterServices.generateRouteFromState({ channelId: channel.id }));

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
