import React from 'react';
import { Plus } from 'react-feather';
import { TabType } from 'app/models/Tab';
import { Button } from 'antd';

import TabsTemplateEditor from './TabsTemplateEditor';
import ModalManager from 'app/components/Modal/ModalManager';
import RouterServices from 'app/services/RouterService';
import DefaultChannelTab from 'app/scenes/Client/MainView/Tabs/DefaultChannelTab';
import Tab from 'app/scenes/Client/MainView/Tabs/Tab';
import UserService from 'services/user/UserService';
import useTabs from 'app/state/recoil/hooks/useTabs';

import './Tabs.scss';
import AccessRightsService from 'app/services/AccessRightsService';

export default (): JSX.Element => {
  const { workspaceId, tabId } = RouterServices.getStateFromRoute();
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
    <div style={{ width: '100%', height: '47px', overflow: 'auto' }}>
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
        </span>
      )}
      {AccessRightsService.hasLevel(workspaceId, 'member') && (
        <Button
          className="add-tab-button"
          type="text"
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
          icon={<Plus size={14} />}
        />
      )}
    </div>
  );
};
