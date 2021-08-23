import React from 'react';
import { TabResource } from 'app/models/Tab';
import { Button, Row, Tabs } from 'antd';

import TabsTemplateEditor from './TabsTemplateEditor';
import ModalManager from 'app/components/Modal/ModalManager';
import Collections from 'services/CollectionsReact/Collections';
import RouterServices from 'app/services/RouterService';
import { Plus } from 'react-feather';
import DefaultChannelTab from 'app/scenes/Client/MainView/Tabs/DefaultChannelTab';
import Tab from 'app/scenes/Client/MainView/Tabs/Tab';
import UserService from 'services/user/UserService';
import AccessRightsService from 'app/services/AccessRightsService';

import './Tabs.scss';

export default (): JSX.Element => {
  const { companyId, workspaceId, channelId, tabId } = RouterServices.getStateFromRoute();
  const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/tabs/`;
  const TabsCollection = Collections.get(collectionPath, TabResource);
  const tabsList: TabResource[] = TabsCollection.useWatcher(
    {},
    { observedFields: ['id', 'name', 'configuration'] },
  );
  const currentUser = UserService.getCurrentUser();

  const upsertTab = async (tab: TabResource) => await TabsCollection.upsert(tab);
  const deleteTab = async (tab: TabResource) => await TabsCollection.remove(tab);

  if (tabId && tabsList.map(e => e.id).indexOf(tabId || '') < 0) {
    const route: string = RouterServices.generateRouteFromState({
      tabId: '',
    });
    RouterServices.push(route);
  }

  return (
    <Row align="middle" className="main-view-tabs" wrap={false}>
      {tabsList.sort((a, b) => (a.data.order || '').localeCompare(b.data.order || '')) && (
        <Tabs activeKey={tabId ? tabId : 'default'}>
          <Tabs.TabPane tab={<DefaultChannelTab selected={!tabId} />} key="default" />
          {tabsList.map((tab: TabResource) => {
            return (
              tab.data.id && (
                <Tabs.TabPane
                  tab={
                    <Tab
                      currentUserId={currentUser.id}
                      selected={tabId === tab.data.id}
                      key={tab.data.id}
                      tabResource={tab}
                      upsertTab={upsertTab}
                      deleteTab={deleteTab}
                    />
                  }
                  key={tab.data.id}
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
                onChangeTabs={(item: TabResource) => upsertTab(item)}
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
