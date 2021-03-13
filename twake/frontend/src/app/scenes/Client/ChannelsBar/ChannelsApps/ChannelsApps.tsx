import React, { Component } from 'react';

import Collections from 'app/services/Depreciated/Collections/Collections.js';
import Languages from 'services/languages/languages.js';
import Workspaces from 'services/workspaces/workspaces.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import UserService from 'services/user/user.js';
import ChannelCategory from 'app/scenes/Client/ChannelsBar/Parts/Channel/ChannelCategory';
import ChannelUI from 'app/scenes/Client/ChannelsBar/Parts/Channel/Channel';
import ChannelsBarService from 'app/services/channels/ChannelsBarService';
import AccessRightsService from 'app/services/AccessRightsService';

export default class ChannelsApps extends Component {
  constructor(props: any) {
    super(props);

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
      Collections.get('channels').did_load_first_time[
        'channels_' + Workspaces.currentWorkspaceId
      ] ||
      !AccessRightsService.hasLevel(Workspaces.currentWorkspaceId, 'member')
    ) {
      ChannelsBarService.collectionIsReady(
        Workspaces.currentGroupId,
        Workspaces.currentWorkspaceId + '+applications',
      );
    }

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
      .filter((channel: any) => channel)
      .filter(
        (channel: any) =>
          channel.members &&
          channel.members.length &&
          (channel.members || [])
            .concat(channel.ext_members || [])
            .indexOf(UserService.getCurrentUserId()) >= 0,
      );

    const workspace_channels_by_app_id: any = {};
    workspace_apps_channels.map((ch: any) => {
      ch.app_id && (workspace_channels_by_app_id[ch.app_id] = ch);
    });

    return (
      <div className="applications_channels" style={{ marginTop: 8 }}>
        {Object.keys(workspace_channels_by_app_id).map(id => {
          const channel = workspace_channels_by_app_id[id];
          if (!channel) {
            return '';
          }
          const app = Collections.get('applications').find(channel.app_id);
          if (channel && !(!app || !(app.display || {}).app)) {
            const name = Languages.t('app.name.' + app.simple_name, [], app.name);
            let icon = WorkspacesApps.getAppIcon(app);
            if ((icon || '').indexOf('http') === 0) {
              icon = '';
            }

            return (
              <ChannelUI
                key={id}
                collection={Collections.get('channels')}
                app={app}
                name={name}
                icon={icon}
                id={channel.id}
                muted={false}
                favorite={false}
                visibility={'public'}
                unreadMessages={false}
                notifications={0}
              />
            );
          }
          return '';
        })}
      </div>
    );
  }
}
