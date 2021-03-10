import Observable from 'app/services/Depreciated/observable.js';
import Workspaces from 'services/workspaces/workspaces.js';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections.js';
import Collections from 'app/services/CollectionsReact/Collections';
import LocalStorage from 'services/localStorage.js';
import WindowService from 'services/utils/window.js';
import MenusManager from 'app/components/Menus/MenusManager.js';
import Globals from 'services/Globals.js';
import { TabResource } from 'app/models/Tab';
import { ChannelResource } from 'app/models/Channel';
import UsersService from 'services/user/user.js';
import RouterService from 'app/services/RouterService';
import _ from 'lodash';

class Channels extends Observable {
  constructor() {
    super();
    this.setObservableName('channels');

    this.state = {
      channels_repository: DepreciatedCollections.get('channels'),
    };

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
        DepreciatedCollections.get('channels').findByFrontId(that.currentChannelFrontId),
      );
    });
  }

  readChannelIfNeeded(channel) {}

  async openDiscussion(membersIds, companyId = null) {
    companyId = companyId || (RouterService.getStateFromRoute() || {}).companyId;
    const collectionPath = `/channels/v1/companies/${companyId}/workspaces/direct/channels/::mine`;
    const channelsCollections = Collections.get(collectionPath, ChannelResource);
    const currentUserId = UsersService.getCurrentUserId();
    const currentUserAlreadyInMembersIds = membersIds.includes(currentUserId);

    if (!currentUserAlreadyInMembersIds) {
      membersIds.push(currentUserId);
    }
    membersIds = membersIds.filter((e, index) => membersIds.indexOf(e) === index);

    const newDirectMessage = {
      company_id: companyId,
      workspace_id: 'direct',
      visibility: 'direct',
      members: membersIds,
    };

    const directChannels = channelsCollections.find(
      { company_id: companyId, workspace_id: 'direct' },
      { withoutBackend: true },
    );

    let res = directChannels.filter(channel =>
      _.isEqual(channel.data.members.sort(), membersIds.sort()),
    )[0];

    if (!res) {
      res = await channelsCollections.upsert(new ChannelResource(newDirectMessage), {
        query: { members: membersIds },
        waitServerReply: true,
      });
    }

    if (res) {
      RouterService.history.push(
        RouterService.generateRouteFromState({
          channelId: res.id,
          companyId: res.data.company_id,
        }),
      );
    }

    MenusManager.closeMenu();
  }

  search(query, callback) {
    if (query.length == 0) {
      callback([]);
      return;
    }

    const { companyId, workspaceId } = RouterService.getStateFromRoute();
    const collection = this.getCollection(companyId, workspaceId);
    callback(
      collection.find({}).filter(channel => {
        return channel.data.name.toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) >= 0;
      }),
    );
  }

  select(channel, side = false, sideOptions = {}) {
    if (side) {
      if (
        this.currentSideChannelFrontId != channel.front_id &&
        channel.id &&
        !channel.application
      ) {
        this.readChannelIfNeeded(channel);
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

      channel = DepreciatedCollections.get('channels').findByFrontId(channel.front_id);

      if (!channel) {
        return;
      }

      this.reached_initial_channel = true;

      if (this.currentChannelFrontId != channel.front_id && channel.id && !channel.application) {
        this.readChannelIfNeeded(channel);
      }

      (channel.tabs || []).forEach(tab => {
        DepreciatedCollections.get('channel_tabs').completeObject(tab);
      });
      DepreciatedCollections.get('channel_tabs').notify();

      this.currentChannelFrontId = channel.front_id;
      this.currentChannelFrontIdByWorkspace[Workspaces.currentWorkspaceId] = channel.front_id;

      RouterService.history.push(RouterService.generateRouteFromState({ channelId: channel.id }));

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

  async saveTab(companyId, workspaceId, channelId, tabId, configuration) {
    const collectionPath = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/tabs/`;
    const TabsCollection = Collections.get(collectionPath, TabResource);
    const tab = TabsCollection.findOne(tabId, { withoutBackend: true });
    tab.data.configuration = configuration;
    await TabsCollection.upsert(tab);
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
  }

  incrementChannel(channel) {
    channel._user_last_message_increment = channel._user_last_message_increment || 0;
    channel._user_last_message_increment++;
    channel.messages_increment++;
    channel.last_activity = new Date().getTime() / 1000;
    channel._user_last_access = new Date().getTime() / 1000;
    DepreciatedCollections.get('channels').completeObject(channel);
  }

  getChannelForApp(app_id, workspace_id) {
    return DepreciatedCollections.get('channels').findBy({
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

  getCollection(companyId, workspaceId) {
    const path = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/::mine`;
    return Collections.get(path, ChannelResource);
  }
}

Globals.services.channelsService = Globals.services.channelsService || new Channels();
export default Globals.services.channelsService;
