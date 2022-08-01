import React from 'react';
import classNames from 'classnames';
import RouterServices from 'app/features/router/services/router-service';
import WorkspacesApps from 'app/deprecated/workspaces/workspaces_apps.js';
import Menu from 'components/menus/menu.js';
import { MoreHorizontal, MessageCircle } from 'react-feather';
import Languages from 'app/features/global/services/languages-service';
import popupManager from 'app/deprecated/popupManager/popupManager.js';
import WorkspaceParameter from '../../popup/WorkspaceParameter/WorkspaceParameter';
import { Application } from 'app/features/applications/types/application';
import ConnectorsListManager from 'app/components/connectors-list-manager/connectors-list-manager';
import MainViewService from 'app/features/router/services/main-view-service';
import { isArray } from 'lodash';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import { getCompanyApplication as getApplication } from 'app/features/applications/state/company-applications';
import { getCompanyApplications } from 'app/features/applications/state/company-applications';
import Groups from 'app/deprecated/workspaces/groups.js';
import { useChannel } from 'app/features/channels/hooks/use-channel';

export default ({ selected }: { selected: boolean }): JSX.Element => {
  const { companyId, workspaceId, channelId } = RouterServices.getStateFromRoute();
  const { channel, save: saveChannel } = useChannel(channelId || '');

  const configureChannelConnector = (app: Application): void => {
    return WorkspacesApps.notifyApp(app.id, 'configuration', 'channel', {
      channel: channel,
    });
  };

  const onChange = (ids: string[]): void => {
    saveChannel({ ...channel, connectors: ids });
  };

  const current = () => {
    return (
      isArray(channel.connectors) &&
      channel.connectors
        .map((id: string) => getApplication(id))
        .filter(application => application !== undefined)
    );
  };

  if (selected) {
    MainViewService.select(MainViewService.getId(), {
      app: {
        identity: {
          code: 'messages',
          name: '',
          icon: '',
          description: '',
          website: '',
          categories: [],
          compatibility: [],
        },
      },
      context: { type: 'channel' },
      hasTabs: MainViewService.getConfiguration().hasTabs,
    });
  }

  return (
    <span
      className={classNames({
        'tab-component-selected align-items-center': selected,
        'tab-component align-items-center': !selected,
      })}
      onClick={() => {
        const route: string = RouterServices.generateRouteFromState({
          tabId: '',
        });
        return RouterServices.push(route);
      }}
    >
      <MessageCircle size={14} className="small-right-margin" />

      <span className="tab-name small-right-margin">
        {Languages.t('scenes.app.mainview.discussion')}
      </span>

      {!!selected &&
        AccessRightsService.hasLevel(workspaceId, 'member') &&
        AccessRightsService.getCompanyLevel(companyId) !== 'guest' && (
          <Menu
            style={{ lineHeight: 0 }}
            menu={[
              {
                type: 'menu',
                text: Languages.t('scenes.apps.tasks.connectors_menu'),
                submenu: [
                  {
                    type: 'react-element',
                    reactElement: () => {
                      const apps = getCompanyApplications(Groups.currentGroupId).filter(
                        (app: Application) =>
                          (app?.display?.twake?.configuration || []).includes('channel'),
                      );

                      if (apps.length) {
                        return (
                          <ConnectorsListManager
                            list={apps}
                            current={current() || []}
                            onChange={onChange}
                            onConfig={configureChannelConnector}
                          />
                        );
                      }
                      return (
                        <div className="menu-text">
                          {Languages.t(
                            'scenes.app.mainview.tabs.no_connected_connectors_for_channel',
                            [],
                            "Vous n'avez aucun connecteur capable de se connecter à une chaîne.",
                          )}
                        </div>
                      );
                    },
                  },
                  { type: 'separator' },
                  {
                    type: 'menu',
                    text: Languages.t(
                      'scenes.app.mainview.tabs.searching_connectors',
                      [],
                      'Chercher des connecteurs...',
                    ),
                    onClick: () =>
                      popupManager.open(
                        <WorkspaceParameter initial_page={3} options={'open_search_apps'} />,
                        true,
                      ),
                  },
                ],
              },
            ]}
          >
            <MoreHorizontal size={14} />
          </Menu>
        )}
    </span>
  );
};
