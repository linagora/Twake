import React from 'react';
import { Plus } from 'react-feather';
import { TabType } from 'app/models/Tab';
import { Button, Row, Tabs } from 'antd';

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
    <Row align="middle" className="main-view-tabs" wrap={false}>
      {tabsList.sort((a, b) => (a.order || '').localeCompare(b.order || '')) && (
        <Tabs activeKey={tabId ? tabId : 'default'}>
          <Tabs.TabPane tab={<DefaultChannelTab selected={!tabId} />} key="default" />
          {tabsList.map((tab: TabType) => {
            return (
              tab.id && (
                <Tabs.TabPane
                  tab={
                    <Tab
                      currentUserId={currentUser.id}
                      selected={tabId === tab.id}
                      tabId={tab.id}
                    />
                  }
                  key={tab.id}
                />
              )
            );
          })}
        </Tabs>
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
    </Row>
  );
};
