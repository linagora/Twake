import React, {Component} from 'react';

import Collections from 'services/Collections/Collections.js';
import Languages from 'services/languages/languages.js';
import Workspaces from 'services/workspaces/workspaces.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import UserService from 'services/user/user.js';

import ChannelCategory from 'components/Leftbar/Channel/ChannelCategory.js';
import ChannelUI from 'components/Leftbar/Channel/Channel.js';
import Channel from '../Channel.js';

export default class ChannelsApps extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
    };

    Collections.get('channels').addListener(this);
    Collections.get('applications').addListener(this);
    Languages.addListener(this);
  }
  componentWillUnmount() {
    Collections.get('channels').removeListener(this);
    Collections.get('applications').removeListener(this);
    Languages.removeListener(this);
  }
  render() {
    if (
      !Collections.get('channels').did_load_first_time['channels_' + Workspaces.currentWorkspaceId]
    ) {
      return (
        <div className="apps_channels loading_render">
          <ChannelCategory text="" style={{ marginTop: '14px' }} />
          <ChannelUI text="" />
          <ChannelUI text="" />
        </div>
      );
    }

    var workspace_apps_channels = Collections.get('channels').findBy({
      direct: false,
      application: true,
      original_workspace: Workspaces.currentWorkspaceId,
    });
    workspace_apps_channels = workspace_apps_channels
      .filter(channel => channel)
      .filter(
        channel =>
          channel.members &&
          channel.members.length &&
          (channel.members || [])
            .concat(channel.ext_members || [])
            .indexOf(UserService.getCurrentUserId()) >= 0,
      );

    var workspace_channels_by_app_id = {};
    workspace_apps_channels.map(ch => {
      workspace_channels_by_app_id[ch.app_id] = ch;
    });

    var workspace_apps = WorkspacesApps.getApps().filter(app => (app.display || {}).app);

    return (
      <div className={'apps_channels'}>
        {Object.keys(workspace_channels_by_app_id).length > 0 && (
          <ChannelCategory
            text={Languages.t('scenes.app.channelsbar.channelsapps.apps', [], 'APPLICATIONS')}
            style={{ marginTop: '14px' }}
          />
        )}

        <div>
          {Object.keys(workspace_channels_by_app_id).map(id => {
            var channel = workspace_channels_by_app_id[id];
            var app = Collections.get('applications').find(channel.app_id);

            if (channel && !(!app || !(app.display || {}).app)) {
              return <Channel key={channel.front_id} channel={channel} app={app} />;
            }
            return '';
          })}
        </div>
      </div>
    );
  }
}
