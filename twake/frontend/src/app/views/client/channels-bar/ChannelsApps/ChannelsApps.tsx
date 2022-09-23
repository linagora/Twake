import React, { Component } from 'react';

import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import Languages from 'app/features/global/services/languages-service';
import Workspaces from 'app/deprecated/workspaces/workspaces.js';
import WorkspacesApps from 'app/deprecated/workspaces/workspaces_apps.js';
import ChannelUI from 'app/views/client/channels-bar/Parts/Channel/Channel';
import {
  useCompanyApplications,
  useCompanyApplicationsRealtime,
} from 'app/features/applications/hooks/use-company-applications';
import useRouterChannel from 'app/features/router/hooks/use-router-channel';

// This should be deleted
export default class ChannelsApps extends Component<unknown> {
  constructor(props: unknown) {
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
                app={app}
                name={name}
                icon={icon}
                id={app.id}
                favorite={false}
                visibility={'public'}
                unreadMessages={0}
                notificationLevel={'all'}
                mentions={0}
                replies={0}
                unread={0}
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

  const channelId = useRouterChannel();

  return (
    <div className="applications_channels" style={{ marginTop: 8 }}>
      {companyApplications
        .filter(app => app.display?.twake?.standalone)
        .map(app => (
          <ChannelUI
            key={app.id}
            id={app.id}
            selected={app.id == channelId}
            channelId={channelId}
            app={app}
            name={app.identity.name}
            icon={app.identity.icon || <></>}
            favorite={false}
            visibility={'public'}
            notificationLevel={'all'}
            unreadMessages={0}
            mentions={0}
            replies={0}
            unread={0}
          />
        ))}
    </div>
  );
};
