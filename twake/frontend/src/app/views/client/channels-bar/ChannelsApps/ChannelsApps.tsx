import React, { Component } from 'react';

import Collections from 'app/services/Depreciated/Collections/Collections.js';
import Languages from 'services/languages/languages';
import Workspaces from 'services/workspaces/workspaces.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import ChannelUI from 'app/views/client/channels-bar/Parts/Channel/Channel';
import {
  useCompanyApplications,
  useCompanyApplicationsRealtime,
} from 'app/state/recoil/hooks/useCompanyApplications';
import RouterService from 'app/services/RouterService';

// This should be deleted
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
    WorkspacesApps.addListener(this);
  }
  componentWillUnmount() {
    Collections.get('channels').removeListener(this);
    Collections.get('applications').removeListener(this);
    Languages.removeListener(this);
    WorkspacesApps.removeListener(this);
  }
  render() {
    //@ts-ignore
    const apps = WorkspacesApps.apps_by_group[Workspaces.currentGroupId] || {};

    return (
      <div className="applications_channels" style={{ marginTop: 8 }}>
        {Object.keys(apps).map(id => {
          const groupApp = apps[id];
          if (!groupApp) {
            return '';
          }
          const app = groupApp.app;
          if (groupApp && !(!app || !(app.display || {}).app)) {
            const name = Languages.t(
              'app.identity?.name.' + app?.identity?.code,
              [],
              app.identity?.name,
            );
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
                id={app.id}
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

type PropsType = {
  companyId: string;
};

export const CompanyApplications = ({ companyId }: PropsType) => {
  const { applications: companyApplications } = useCompanyApplications(companyId);
  useCompanyApplicationsRealtime();
  const { channelId } = RouterService.getStateFromRoute();
  return (
    <div className="applications_channels" style={{ marginTop: 8 }}>
      {companyApplications
        .filter(app => app.display?.twake?.standalone)
        .map(app => (
          <ChannelUI
            key={app.id}
            id={app.id}
            channelId={channelId}
            app={app}
            name={app.identity.name}
            icon={app.identity.icon}
            muted={false}
            favorite={false}
            visibility={'public'}
            unreadMessages={false}
            notifications={0}
            collection={Collections.get('channels')}
          />
        ))}
    </div>
  );
};
