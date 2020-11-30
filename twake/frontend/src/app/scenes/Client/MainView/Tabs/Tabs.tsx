import React from 'react';
import Languages from 'services/languages/languages';
import { TabType, TabResource } from 'app/models/Tab';
import { Button, Row, Col, Tabs } from 'antd';

import TabsTemplateEditor from './TabsTemplateEditor';
import Icon from 'app/components/Icon/Icon';
import ModalManager from 'services/Modal/ModalManager';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import Collections from 'services/CollectionsReact/Collections';
import RouterServices from 'app/services/RouterService';
const { TabPane } = Tabs;

export default (): JSX.Element => {
  const { companyId, workspaceId, channelId, tabId } = RouterServices.useStateFromRoute();
  const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/tabs/`;
  const TabsCollection = Collections.get(collectionPath, TabResource);

  const tabsList: TabResource[] = TabsCollection.useWatcher({});

  const insertTab = async (newTab: TabType) => {
    await TabsCollection.insert(new TabResource(newTab));
  };

  const getAppIcon = (tab: TabType) => {
    WorkspacesApps.getApp(tab.application_id, (item: TabResource) => {
      return WorkspacesApps.getAppIcon(item);
    });
  };

  return (
    <Row align="top">
      {tabsList && (
        <Col>
          <Tabs className="main-view-tabs" activeKey={tabId ? tabId : 'default'}>
            <TabPane
              tab={
                <span
                  onClick={() => {
                    const route: string = RouterServices.generateRouteFromState({
                      tabId: '',
                    });
                    return RouterServices.history.push(route);
                  }}
                >
                  <Icon type={'comment'} />
                  {Languages.t('scenes.app.mainview.discussion')}
                </span>
              }
              key="default"
            />
            {tabsList.map((tab: TabResource) => {
              return (
                <TabPane
                  tab={
                    <span
                      onClick={() => {
                        const route: string = RouterServices.generateRouteFromState({
                          tabId: tab.id,
                        });
                        return RouterServices.history.push(route);
                      }}
                    >
                      <Icon type={getAppIcon(tab)} />
                      {tab.data.name}
                    </span>
                  }
                  key={tab.id}
                />
              );
            })}
          </Tabs>
        </Col>
      )}
      <Col style={{ lineHeight: '47px' }}>
        <Button
          type="text"
          icon={
            <Icon
              type={'plus-square'}
              onClick={() => {
                return ModalManager.open(
                  <TabsTemplateEditor
                    tabs={tabsList}
                    onChangeTabs={(item: TabType) => insertTab(item)}
                  />,
                  {
                    position: 'center',
                    size: { width: '500px', minHeight: '329px' },
                  },
                );
              }}
            />
          }
        />
      </Col>
    </Row>
  );
};
