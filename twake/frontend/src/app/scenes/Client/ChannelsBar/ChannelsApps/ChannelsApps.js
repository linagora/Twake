import React, { Component } from 'react';

import Collections from 'app/services/Depreciated/Collections/Collections.js';
import Languages from 'services/languages/languages.js';
import Workspaces from 'services/workspaces/workspaces.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import UserService from 'services/user/user.js';

import ChannelCategory from 'components/Leftbar/Channel/ChannelCategory.js';
import ChannelUI from 'components/Leftbar/Channel/Channel';
import Channel from '../Channel.js';

export default class ChannelsApps extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
    };

    Collections.get('channels').addSource(
      {
        http_base_url: 'channels',
        http_options: {
          workspace_id: Workspaces.currentWorkspaceId,
        },
        websockets: [
          {
            uri: 'channels/workspace/' + Workspaces.currentWorkspaceId,
            options: { type: 'channels/workspace' },
          },
          {
            uri:
              'channels/workspace_private/' +
              Workspaces.currentWorkspaceId +
              '/' +
              UserService.getCurrentUserId(),
            options: { type: 'channels/workspace_private' },
          },
        ],
      },
      'channels_' + Workspaces.currentWorkspaceId,
    );

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
      return <div />;
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

    console.log(workspace_channels_by_app_id);

    return (
      <div style={{ marginTop: -8 }}>
        <ChannelCategory
          refAdd={node => {
            node = node;
          }}
          text={Languages.t('scenes.app.channelsbar.channelsapps.apps')}
        />
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
