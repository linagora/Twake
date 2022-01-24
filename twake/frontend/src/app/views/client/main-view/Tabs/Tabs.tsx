import React from 'react';
import { Plus } from 'react-feather';
import { TabType } from 'app/models/Tab';

import TabsTemplateEditor from './TabsTemplateEditor';
import ModalManager from 'app/components/modal/modal-manager';
import RouterServices from 'app/services/RouterService';
import DefaultChannelTab from 'app/views/client/main-view/Tabs/DefaultChannelTab';
import Tab from 'app/views/client/main-view/Tabs/Tab';
import UserService from 'services/user/UserService';
import useTabs from 'app/state/recoil/hooks/useTabs';
import AccessRightsService from 'app/services/AccessRightsService';
import useRouterCompany from '../../../../state/recoil/hooks/router/useRouterCompany';
import useRouterWorkspace from 'app/state/recoil/hooks/router/useRouterWorkspace';
import useRouterTab from 'app/state/recoil/hooks/router/useRouterTab';

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
                      size: { width: '500px', minHeight: '329px' },
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
