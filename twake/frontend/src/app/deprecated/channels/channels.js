import Observable from 'app/deprecated/CollectionsV1/observable.js';
import Workspaces from 'app/deprecated/workspaces/workspaces.js';
import DepreciatedCollections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import LocalStorage from 'app/features/global/framework/local-storage-service';
import WindowService from 'app/features/global/utils/window';
import MenusManager from 'app/components/menus/menus-manager.js';
import Globals from 'app/features/global/services/globals-twake-app-service';
import RouterService from 'app/features/router/services/router-service';
import _ from 'lodash';
import ChannelAPIClient from '../../features/channels/api/channel-api-client';

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

  //Should not be used anymore
  search(query, callback) {
    if (query.length === 0) {
      callback([]);
      return;
    }

    const { companyId, workspaceId } = RouterService.getStateFromRoute();
    const collection = this.getCollection(companyId, workspaceId);
    callback(
      collection.find({}).filter(channel => {
        return channel.name.toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) >= 0;
      }),
    );
  }

  select(channel, side = false, sideOptions = {}) {}

  getChannelForApp(app_id, workspace_id) {
    return DepreciatedCollections.get('channels').findBy({
      application: true,
      direct: false,
      app_id: app_id,
      original_workspace: workspace_id,
    })[0];
  }

  getCollection(companyId, workspaceId) {
    //const path = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/::mine`;
    //return Collections.get(path, ChannelType);
  }
}

Globals.services.channelsService = Globals.services.channelsService || new Channels();
export default Globals.services.channelsService;
