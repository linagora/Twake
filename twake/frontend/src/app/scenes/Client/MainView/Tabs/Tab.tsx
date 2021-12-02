import React from 'react';
import { TabType } from 'app/models/Tab';
import RouterServices from 'app/services/RouterService';
import TabsTemplateEditor from './TabsTemplateEditor';
import ModalManager from 'app/components/Modal/ModalManager';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import Menu from 'components/Menus/Menu.js';
import { MoreHorizontal } from 'react-feather';
import Languages from 'services/languages/languages';
import { capitalize } from 'lodash';
import AccessRightsService from 'app/services/AccessRightsService';
import MainViewService from 'app/services/AppView/MainViewService';
import { getApplication } from 'app/state/recoil/hooks/useCompanyApplications';
import { useTab } from 'app/state/recoil/hooks/useTabs';

type PropsType = {
  tabId: string;
  currentUserId: string;
  selected: boolean;
};

export default ({ selected, tabId, currentUserId }: PropsType): JSX.Element => {
  const { workspaceId } = RouterServices.getStateFromRoute();
  const { tab, remove, save } = useTab(tabId || '');
  const isCurrentUserAdmin: boolean = AccessRightsService.useWatcher(() =>
    AccessRightsService.hasLevel(workspaceId, 'moderator'),
  );

  if (!tab) {
    return <></>;
  }

  if (selected && tab) {
    MainViewService.select(MainViewService.getId(), {
      collection: MainViewService.getConfiguration().collection,
      context: {
        tabId: tab.id,
        configuration: tab.configuration || {},
        name: tab.name,
      },
      app: getApplication(tab.application_id || ''),
      hasTabs: MainViewService.getConfiguration().hasTabs,
    });
  }

  return (
    <span
      className="align-items-center"
      onClick={() => {
        const route: string = RouterServices.generateRouteFromState({
          tabId: tab.id,
        });
        return RouterServices.push(route);
      }}
    >
      {WorkspacesApps.getAppIconComponent(tab, { size: 14 })}
      <span style={{ maxWidth: '108px', marginBottom: 0 }} className="tab-name small-right-margin">
        {capitalize(tab.name)}
      </span>
      {tab.id === tabId && AccessRightsService.hasLevel(workspaceId, 'member') && (
        <Menu
          style={{ lineHeight: 0 }}
          menu={[
            {
              type: 'menu',
              text: Languages.t('scenes.app.mainview.tabs.rename'),
              hide: false,
              onClick: () =>
                ModalManager.open(
                  <TabsTemplateEditor tab={tab} onChangeTabs={(item: TabType) => save(item)} />,
                  {
                    position: 'center',
                    size: { width: '500px', minHeight: '329px' },
                  },
                ),
            },
            {
              type: 'menu',
              hide: currentUserId !== tab.owner && !isCurrentUserAdmin,
              text: <div style={{ color: 'var(--red)' }}>{Languages.t('general.delete')}</div>,
              onClick: () => remove(),
            },
          ]}
        >
          <MoreHorizontal size={14} />
        </Menu>
      )}
    </span>
  );
};
