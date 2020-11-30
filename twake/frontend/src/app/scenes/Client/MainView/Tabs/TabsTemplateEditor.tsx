import React, { useState, useEffect } from 'react';
import { AppType } from 'app/models/App';
import { TabType } from 'app/models/Tab';
import { Button, Row, Input, Select } from 'antd';

import Icon from 'app/components/Icon/Icon';
import ModalManager from 'services/Modal/ModalManager';
import ObjectModal from 'components/ObjectModal/ObjectModal';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';

const { Option } = Select;

type PropsType = {
  tabs: TabType[];
  defaultKey?: string;
  onChangeTabs?: any;
};

export default (props: PropsType): JSX.Element => {
  const [appId, setAppId] = useState<string>('');
  const [tabName, setTabName] = useState<string>('');
  const [workspacesApps, setWorkspacesApps] = useState<AppType[]>([]);

  useEffect(() => {
    generateWorkspacesApps();
  }, []);

  const generateWorkspacesApps = () => {
    const apps: AppType[] = WorkspacesApps.getApps();
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
            {workspacesApps
              .filter((app: AppType) => (app.display || {}).channel)
              .map((app: AppType) => {
                return (
                  // To do, find a way to use the jitsi image
                  <Option key={`key_${app.id}`} value={app.id || ''}>
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
