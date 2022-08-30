import React, { useState, useEffect } from 'react';
import { Button, Row, Input, Select } from 'antd';

import { Application, AppType } from 'app/features/applications/types/application';
import Groups from 'app/deprecated/workspaces/groups.js';
import { TabType } from 'app/features/tabs/types/tab';
import Icon from 'app/components/icon/icon';
import ModalManager from 'app/components/modal/modal-manager';
import ObjectModal from 'components/object-modal/object-modal';
import WorkspacesApps from 'app/deprecated/workspaces/workspaces_apps.js';
import Languages from 'app/features/global/services/languages-service';
import { getCompanyApplications } from 'app/features/applications/state/company-applications';
import { useCompanyApplications } from 'app/features/applications/hooks/use-company-applications';
import { useCurrentCompany } from 'app/features/companies/hooks/use-companies';

const { Option } = Select;

type PropsType = {
  tab?: TabType;
  onChangeTabs: (tab: TabType) => void;
  currentUserId?: string;
};

export default (props: PropsType): JSX.Element => {
  const [appId, setAppId] = useState<string>(props.tab?.application_id || '');
  const [tabName, setTabName] = useState<string>(props.tab?.name || '');
  const [, setWorkspacesApps] = useState<AppType[]>([]);
  const { company } = useCurrentCompany();

  const { applications: companyApplications } = useCompanyApplications(company?.id || '');

  useEffect(() => {
    generateWorkspacesApps();
  }, []);

  const generateWorkspacesApps = () => {
    const apps: AppType[] = getCompanyApplications(Groups.currentGroupId);
    return setWorkspacesApps(apps);
  };

  return (
    <ObjectModal
      title={
        props.tab?.id
          ? Languages.t('scenes.client.mainview.tabs.tabstemplateeditor.title_tab_edition', [
              props.tab?.name,
            ])
          : Languages.t('scenes.client.mainview.tabs.tabstemplateeditor.title_tab_creation')
      }
      closable
      footer={
        <Button
          type="primary"
          disabled={!appId}
          onClick={() => {
            let editedTab: TabType | undefined = props.tab;

            ModalManager.closeAll();

            if (editedTab?.id) {
              editedTab = {
                ...editedTab,
                name: tabName,
              };
            } else {
              editedTab = {
                name: tabName,
                order: '' + new Date().getTime(),
                owner: props.currentUserId,
                application_id: appId,
                configuration: {},
              };
            }

            return props.onChangeTabs(editedTab);
          }}
        >
          {Languages.t(props.tab?.id ? 'general.edit' : 'general.create')}
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
        {!props.tab?.id && (
          <Row justify="start">
            <Select
              size={'large'}
              onChange={(value: string) => setAppId(value)}
              value={appId ? appId : undefined}
              placeholder={Languages.t(
                'scenes.client.mainview.tabs.tabstemplateeditor.select_placeholder',
              )}
            >
              {companyApplications
                .filter((app: Application) => app.display?.twake?.tab)
                .map((app: Application) => {
                  return (
                    <Option key={`key_${app.id}`} value={app.id || ''}>
                      <Icon type={WorkspacesApps.getAppIcon(app)} /> {app.identity.name}
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
