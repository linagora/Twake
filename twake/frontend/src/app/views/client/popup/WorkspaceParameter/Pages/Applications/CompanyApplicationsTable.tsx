import React, { useEffect, useRef, useState } from 'react';

import { ColumnsType } from 'antd/lib/table';
import { MoreHorizontal } from 'react-feather';
import { Divider, Table, Typography, Row, Col, Button, Grid } from 'antd';

import { Application } from 'app/features/applications/types/application';
import Languages from 'services/languages/languages';
import ModalManager from 'app/components/modal/modal-manager';
import AvatarComponent from 'app/components/avatar/avatar';
import CompanyApplicationPopup from './CompanyApplicationPopup';
import { useCurrentCompany } from 'app/features/companies/hooks/use-companies';
import {
  useCompanyApplications,
  useCompanyApplicationsRealtime,
} from 'app/features/applications/hooks/use-company-applications';
import Menu from 'components/menus/menu';
import WorkspacesApps from 'app/deprecated/workspaces/workspaces_apps.js';

import './ApplicationsStyles.scss';
import AlertManager from 'app/services/AlertManager/AlertManager';

type ColumnObjectType = { key: number } & Application;

const DEFAULT_PAGE_SIZE = 20;
const { useBreakpoint } = Grid;
export default () => {
  const { company } = useCurrentCompany();

  if (!company?.id) return <></>;

  const {
    applications: companyApplications,
    loading: isLoadingCompanyApplications,
    remove: deleteOneCompanyApplication,
  } = useCompanyApplications(company?.id);
  useCompanyApplicationsRealtime();

  const [data, _setData] = useState<ColumnObjectType[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { xs, sm, md, lg, xl } = useBreakpoint();

  useEffect(() => {
    refreshCompanyApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyApplications]);

  const refreshCompanyApplications = () => {
    companyApplications && setData(companyApplications);
  };

  const buildMenu = (application: Application) => {
    return [
      {
        type: 'menu',
        text: Languages.t(
          'scenes.app.integrations_parameters.company_applications_table.more_menu.show_application',
        ),
        onClick: () =>
          ModalManager.open(
            <CompanyApplicationPopup application={application} companyId={company.id} />,
            {
              position: 'center',
              size: { width: '600px' },
            },
          ),
      },
      {
        type: 'menu',
        className: 'error',
        text: Languages.t(
          'scenes.app.integrations_parameters.company_applications_table.more_menu.remove_application',
        ),
        onClick: () => AlertManager.confirm(() => deleteOneCompanyApplication(application.id)),
      },
    ];
  };

  const setData = (list: Application[]) => {
    if (list) {
      _setData(
        list.map((app, key) => ({
          key: key + 1,
          name: { name: app.identity.name, icon: app.identity.icon },
          description: app.identity.description,
          ...app,
        })),
      );
    }
  };

  const columns: ColumnsType<ColumnObjectType> = [
    {
      title: Languages.t('scenes.app.integrations_parameters.company_applications_table.name'),
      dataIndex: 'name',
      width: 550,
      render: (
        { name, icon }: { name: string; icon: string },
        record: ColumnObjectType,
        index: number,
      ) => {
        return (
          <Row key={index} align="middle">
            <AvatarComponent url={icon} />
            <Typography.Text className="small-left-margin">{name}</Typography.Text>
          </Row>
        );
      },
    },
    {
      dataIndex: 'actions',
      width: 200,

      render: (initialValue: any, record: ColumnObjectType, index: number) => {
        const { key, ...application } = record;
        return (
          <div style={{ float: 'right' }}>
            {!!(application.display?.twake?.configuration || []).includes('global') && (
              <Button
                type="ghost"
                style={{ marginRight: 8 }}
                onClick={() => {
                  WorkspacesApps.notifyApp(application.id, 'configuration', 'workspace', {});
                }}
              >
                {Languages.t('scenes.app.popup.workspaceparameter.pages.configure_button')}
              </Button>
            )}
            <div style={{ display: 'inline-block' }}>
              <Menu menu={buildMenu(application)}>
                <Button
                  type="default"
                  icon={<MoreHorizontal size={18} />}
                  className="applications-table-actions-btn"
                />
              </Menu>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="bottom-margin">
      <Divider />
      <Row justify="start" wrap={false}>
        <Col>
          <Typography.Title level={3}>
            {Languages.t('scenes.app.integrations_parameters.company_applications_table.title')}
          </Typography.Title>
        </Col>
      </Row>
      <div>
        <Table
          loading={isLoadingCompanyApplications}
          columns={columns}
          dataSource={data}
          size="small"
          pagination={{ pageSize: DEFAULT_PAGE_SIZE, simple: true }}
          scroll={{ x: xs || sm ? true : undefined }}
        />
      </div>
    </div>
  );
};
