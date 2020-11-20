import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Tabs, Input, Select } from 'antd';

import Icon from 'app/components/Icon/Icon';
import ModalManager from 'services/Modal/ModalManager';
import ObjectModal from 'components/ObjectModal/ObjectModal';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';

const { TabPane } = Tabs;

type PropsType = {
  tabs: TabsType[];
  defaultKey?: string;
  onChangeTabs?: any;
};

type TabsType = {
  application_id?: string;
  name?: string;
  configuration?: object;
};

const { Option } = Select;

const NewTab = (props: PropsType): JSX.Element => {
  const [appId, setAppId] = useState<string>('');
  const [tabName, setTabName] = useState<string>('');
  const [workspacesApps, setWorkspacesApps] = useState<any>([]);

  useEffect(() => {
    generateWorkspacesApps();
  }, []);

  const generateWorkspacesApps = () => {
    const apps = WorkspacesApps.getApps();
    console.log(apps);
    let list: TabsType[] = [];
    apps.map((app: any) =>
      list.push({ name: app.name, application_id: app.id, configuration: {} }),
    );
    return setWorkspacesApps(apps);
  };

  return (
    <ObjectModal
      title="Create a new tab"
      closable
      footer={
        <Button
          type="primary"
          onClick={() => {
            ModalManager.closeAll();
            return props.onChangeTabs({
              name: tabName,
              application_id: appId,
              configuration: {},
            });
          }}
        >
          Create
        </Button>
      }
    >
      <div className="x-margin">
        <Row justify="center" className="bottom-margin">
          <Input
            value={tabName}
            onChange={(e: { target: { value: string } }) => setTabName(e.target.value)}
            className="medium full_width bottom-margin"
            type="text"
            placeholder="Tab name"
          />
        </Row>
        <Row justify="start">
          <Select value={appId} onChange={(value: string) => setAppId(value)}>
            {workspacesApps.map((app: any) => {
              return (
                <Option key={`key_${app.id}`} value={app.id}>
                  <Icon type={WorkspacesApps.getAppIcon(app)} /> {app.name}
                </Option>
              );
            })}
          </Select>
        </Row>
      </div>
    </ObjectModal>
  );
};

export default (props: PropsType): JSX.Element => {
  return (
    <Row align="top">
      <Col>
        <Tabs className="main-view-tabs" defaultActiveKey={props.defaultKey || '0'}>
          {props.tabs.map((tab: any, index: number) => {
            return (
              <TabPane
                tab={
                  (!tab.button && (
                    <span>
                      {tab.icon && <Icon type={tab.icon} />}
                      {tab.name}
                    </span>
                  )) || <Button icon={<Icon type={tab.icon} />} />
                }
                key={index}
              >
                {tab.children}
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
                  <NewTab
                    tabs={props.tabs}
                    onChangeTabs={(item: TabsType) => props.onChangeTabs(item)}
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
