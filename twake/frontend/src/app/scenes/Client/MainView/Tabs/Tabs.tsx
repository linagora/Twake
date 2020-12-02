import React from 'react';
import Languages from 'services/languages/languages';
import { TabResource } from 'app/models/Tab';
import { Button, Row, Tabs } from 'antd';

import TabsTemplateEditor from './TabsTemplateEditor';
import ModalManager from 'services/Modal/ModalManager';
import Collections from 'services/CollectionsReact/Collections';
import RouterServices from 'app/services/RouterService';
import { MessageCircle, Plus } from 'react-feather';
import Tab from 'app/scenes/Client/MainView/Tabs/Tab';
import UserService from 'services/user/user.js';

import './Tabs.scss';

export default (): JSX.Element => {
  const { companyId, workspaceId, channelId, tabId } = RouterServices.useStateFromRoute();
  const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/tabs/`;
  const TabsCollection = Collections.get(collectionPath, TabResource);
  const tabsList: TabResource[] = TabsCollection.useWatcher({});
  const currentUser = UserService.getCurrentUser();

  const upsertTab = async (tab: TabResource) => await TabsCollection.upsert(tab);
  const deleteTab = (tab: TabResource) => TabsCollection.remove(tab);

  return (
    <Row align="middle" className="main-view-tabs">
      {tabsList.sort((a, b) => (a.data.order || '').localeCompare(b.data.order || '')) && (
        <Tabs activeKey={tabId ? tabId : 'default'}>
          <Tabs.TabPane
            tab={
              <span
                className="align-items-center"
                onClick={() => {
                  const route: string = RouterServices.generateRouteFromState({
                    tabId: '',
                  });
                  return RouterServices.history.push(route);
                }}
              >
                <MessageCircle size={14} className="small-right-margin" />
                {Languages.t('scenes.app.mainview.discussion')}
              </span>
            }
            key="default"
          />
          {tabsList.map((tab: TabResource) => {
            return (
              tab.data.id && (
                <Tabs.TabPane
                  tab={
                    <Tab
                      currentUserId={currentUser.id}
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
    </Row>
  );
};
