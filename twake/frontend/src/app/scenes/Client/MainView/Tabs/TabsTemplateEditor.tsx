import React, { useState, useEffect } from 'react';
import { AppType } from 'app/models/App';
import { TabResource } from 'app/models/Tab';
import { Button, Row, Input, Select } from 'antd';

import Icon from 'app/components/Icon/Icon';
import ModalManager from 'services/Modal/ModalManager';
import ObjectModal from 'components/ObjectModal/ObjectModal';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import Languages from 'services/languages/languages';

const { Option } = Select;

type PropsType = {
  tab?: TabResource;
  onChangeTabs?: any;
  currentUserId?: string;
};

export default (props: PropsType): JSX.Element => {
  const [appId, setAppId] = useState<string>(props.tab?.data.application_id || '');
  const [tabName, setTabName] = useState<string>(props.tab?.data.name || '');
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
      title={
        props.tab?.data.id
          ? Languages.t('scenes.client.mainview.tabs.tabstemplateeditor.title_tab_edition', [
              props.tab?.data.name,
            ])
          : Languages.t('scenes.client.mainview.tabs.tabstemplateeditor.title_tab_creation')
      }
      closable
      footer={
        <Button
          type="primary"
          onClick={() => {
            let editedTab: TabResource | undefined = props.tab;

            ModalManager.closeAll();

            if (editedTab?.data.id) {
              editedTab.data = {
                ...editedTab.data,
                name: tabName,
              };
            } else {
              editedTab = new TabResource({
                name: tabName,
                order: 'pos_' + new Date().getTime(),
                owner: props.currentUserId,
                application_id: appId,
                configuration: {},
              });
            }

            return props.onChangeTabs(editedTab);
          }}
        >
          {Languages.t(props.tab?.data.id ? 'general.edit' : 'general.create')}
        </Button>
      }
    >
      <div className="x-margin">
        <Row justify="center" className="bottom-margin">
          <Input
            size={'large'}
            maxLength={30}
            value={tabName}
            onChange={(e: { target: { value: string } }) => setTabName(e.target.value)}
            className="medium full_width bottom-margin"
            type="text"
            placeholder="Tab name"
          />
        </Row>
        {!props.tab?.data.id && (
          <Row justify="start">
            <Select value={appId} size={'large'} onChange={(value: string) => setAppId(value)}>
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
        )}
      </div>
    </ObjectModal>
  );
};
