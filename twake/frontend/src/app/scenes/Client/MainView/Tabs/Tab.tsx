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
  tabType: TabType;
  saveTab: (tab: TabType) => Promise<void>;
  currentUserId: string;
  selected: boolean;
};

export default ({ selected, tabType, saveTab, currentUserId }: PropsType): JSX.Element => {
  const { tabId, workspaceId } = RouterServices.getStateFromRoute();
  const tab = useTab(tabId || '');
  const isCurrentUserAdmin: boolean = AccessRightsService.useWatcher(() =>
    AccessRightsService.hasLevel(workspaceId, 'moderator'),
  );

  if (selected && tabType) {
    MainViewService.select(MainViewService.getId(), {
      collection: MainViewService.getConfiguration().collection,
      context: {
        tabId: tabType.id,
        configuration: tabType.configuration || {},
        name: tabType.name,
      },
      app: getApplication(tabType.application_id || ''),
      hasTabs: MainViewService.getConfiguration().hasTabs,
    });
  }

  return (
    <span
      className="align-items-center"
      onClick={() => {
        const route: string = RouterServices.generateRouteFromState({
          tabId: tabType.id,
        });
        return RouterServices.push(route);
      }}
    >
      {WorkspacesApps.getAppIconComponent(tabType, { size: 14 })}
      <span style={{ maxWidth: '108px', marginBottom: 0 }} className="tab-name small-right-margin">
        {capitalize(tabType.name)}
      </span>
      {tabType.id === tabId && AccessRightsService.hasLevel(workspaceId, 'member') && (
        <Menu
          style={{ lineHeight: 0 }}
          menu={[
            {
              type: 'menu',
              text: Languages.t('scenes.app.mainview.tabs.rename'),
              hide: false,
              onClick: () =>
                ModalManager.open(
                  <TabsTemplateEditor
                    tab={tabType}
                    onChangeTabs={(item: TabType) => saveTab(item)}
                  />,
                  {
                    position: 'center',
                    size: { width: '500px', minHeight: '329px' },
                  },
                ),
            },
            {
              type: 'menu',
              hide: currentUserId !== tabType.owner && !isCurrentUserAdmin,
              text: <div style={{ color: 'var(--red)' }}>{Languages.t('general.delete')}</div>,
              onClick: () => tab.remove(),
            },
          ]}
        >
          <MoreHorizontal size={14} />
        </Menu>
      )}
    </span>
  );
};
