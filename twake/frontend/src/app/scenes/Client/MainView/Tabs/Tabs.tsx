import React, { useEffect, useState } from 'react';
import { AppType } from 'app/models/App';
import { TabType, TabResource } from 'app/models/Tab';
import { Button, Row, Col, Tabs } from 'antd';

import TabsTemplateEditor from './TabsTemplateEditor';
import Icon from 'app/components/Icon/Icon';
import ModalManager from 'services/Modal/ModalManager';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import Collections from 'services/CollectionsReact/Collections';
import RouterServices from 'services/RouterServices';
const { TabPane } = Tabs;

type PropsType = {
  tabs?: TabType[];
  defaultKey?: string;
  onChangeTabs?: any;
};

export default (props: PropsType): JSX.Element => {
  const { companyId, workspaceId, channelId } = RouterServices.useStateFromRoute();
  const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/tabs/`;
  const TabsCollection = Collections.get(collectionPath, TabResource);
  const [tabsList, setTabsList] = useState<TabType[]>([]);

  useEffect(() => {
    getTabsList();
  });

  const getTabsList = async () => {
    const tabs = await TabsCollection.find({});
    let list: TabType[] = [];

    tabs.map((tab: TabResource) => {
      return list.push(tab.data);
    });

    return setTabsList(list);
  };

  const insertTab = async (newTab: TabType) => {
    await TabsCollection.insert(new TabResource(newTab));
  };

  // To do: fix apps icon function
  const getAppIcon = (tab: TabType) => {
    WorkspacesApps.getApp(tab.application_id, (item: AppType) => {
      return WorkspacesApps.getAppIcon(item) || item.icon_url;
    });
  };
  return (
    <Row align="top">
      <Col>
        <Tabs className="main-view-tabs" defaultActiveKey={props.defaultKey || '0'}>
          {tabsList.map((tab: TabType, index: number) => {
            return (
              <TabPane
                tab={
                  <span>
                    <Icon type={getAppIcon(tab)} />
                    {tab.name}
                  </span>
                }
                key={index}
              >
                {/* This is the content of the tab */}
              </TabPane>
            );
          })}
        </Tabs>
      </Col>
      <Col className="small-top-margin">
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
