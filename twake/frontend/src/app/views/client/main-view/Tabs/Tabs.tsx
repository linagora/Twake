import React from 'react';
import { Plus } from 'react-feather';
import { TabType } from 'app/features/tabs/types/tab';

import TabsTemplateEditor from './TabsTemplateEditor';
import ModalManager from 'app/components/modal/modal-manager';
import RouterServices from 'app/features/router/services/router-service';
import DefaultChannelTab from 'app/views/client/main-view/Tabs/DefaultChannelTab';
import Tab from 'app/views/client/main-view/Tabs/Tab';
import UserService from 'app/features/users/services/current-user-service';
import useTabs from 'app/features/tabs/hooks/use-tabs';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import useRouterCompany from '../../../../features/router/hooks/use-router-company';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import useRouterTab from 'app/features/router/hooks/use-router-tab';

import './Tabs.scss';

export default (): JSX.Element => {
  const workspaceId = useRouterWorkspace();
  const companyId = useRouterCompany();
  const tabId = useRouterTab();
  const { tabs, save } = useTabs();

  const currentUser = UserService.getCurrentUser();
  const tabsList = [...tabs];

  if (tabId && tabs.map(e => e.id).indexOf(tabId || '') < 0) {
    const route: string = RouterServices.generateRouteFromState({
      tabId: '',
    });
    RouterServices.push(route);
  }

  return (
    <div className="tabs-global-container">
      {tabsList.sort((a, b) => (a.order || '').localeCompare(b.order || '')) && (
        <span className="main-view-tabs align-items-center">
          <DefaultChannelTab selected={!tabId} />
          {tabsList.map((tab: TabType) => {
            return (
              tab.id && (
                <Tab
                  key={tab.id}
                  currentUserId={currentUser.id}
                  selected={tabId === tab.id}
                  tabId={tab.id}
                />
              )
            );
          })}
          {AccessRightsService.hasLevel(workspaceId, 'member') &&
            AccessRightsService.getCompanyLevel(companyId) !== 'guest' && (
              <div
                className="add-tab-button"
                onClick={() => {
                  return ModalManager.open(
                    <TabsTemplateEditor
                      currentUserId={currentUser.id}
                      onChangeTabs={(item: TabType) => save(item)}
                    />,
                    {
                      position: 'center',
                      size: { width: '600px', minHeight: '329px' },
                    },
                  );
                }}
              >
                <Plus size={14} />
              </div>
            )}
        </span>
      )}
    </div>
  );
};
