import React, { useEffect, useState } from 'react';

import { Info } from 'react-feather';
import { ColumnsType } from 'antd/lib/table';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';
import { Divider, Table, Typography, Row, Input, Col, Button } from 'antd';

import { Application } from 'app/models/App';
import Languages from 'services/languages/languages';
import ModalManager from 'app/components/Modal/ModalManager';
import { useApplications } from 'app/services/Apps/useApplications';
import { useCurrentCompanyApplications } from 'app/state/recoil/hooks/useCurrentCompanyApplications';
import { useCurrentCompany } from 'app/state/recoil/hooks/useCurrentCompany';
import CompanyApplicationPopup from './CompanyApplicationPopup';
import { delayRequest } from 'app/services/utils/managedSearchRequest';
import AvatarComponent from 'app/components/Avatar/Avatar';

import './ApplicationsStyles.scss';

type ColumnObjectType = { key: number } & Application;
const DEFAULT_PAGE_SIZE = 5;

export default () => {
  const [company] = useCurrentCompany();

  if (!company?.id) return <></>;

  const { applicationsList, isLoadingApplicationsList, searchApplicationsInTwake } =
    useApplications();

  const { isLoadingCompanyApplications } = useCurrentCompanyApplications(company.id);

  const [data, _setData] = useState<ColumnObjectType[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { xs, sm, md, lg, xl } = useBreakpoint();

  useEffect(() => {
    refreshApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationsList]);

  const refreshApplications = () => {
    applicationsList && setData(applicationsList);
  };

  const setData = (list: Application[]) => {
    if (list) {
      _setData(
        list.map((app, key) => ({
          key: key + 1,
          name: { name: app.identity.name, icon: app.identity.icon },
          description: app.identity.description,
          installed: isLoadingCompanyApplications,
          ...app,
        })),
      );
    }
  };

  const columns: ColumnsType<ColumnObjectType> = [
    {
      title: Languages.t('scenes.app.integrations_parameters.applications_table.name'),
      dataIndex: 'name',
      width: 550,
      render: (
        { name, icon }: { name: string; icon: string },
        record: ColumnObjectType,
        index: number,
      ) => (
        <Row key={index} wrap={false} align="middle" justify="start">
          <AvatarComponent url={icon} />
          <Typography.Text className="small-x-margin">{name}</Typography.Text>
        </Row>
      ),
    },
    {
      dataIndex: 'actions',
      render: (initialValue: any, record: ColumnObjectType, index: number) => {
        const { key, ...application } = record;
        return (
          <Button
            key={key}
            loading={isLoadingCompanyApplications}
            type="default"
            className="applications-table-actions-btn"
            icon={<Info size={18} />}
            onClick={() => {
              ModalManager.open(
                <CompanyApplicationPopup application={application} companyId={company.id} />,
                {
                  position: 'center',
                  size: { width: '600px' },
                },
              );
            }}
          />
        );
      },
    },
  ];

  return (
    <>
      <Row justify="space-between" wrap={false}>
        <Col>
          <Typography.Title level={3}>
            {Languages.t('scenes.app.integrations_parameters.applications_table.title')}
          </Typography.Title>
        </Col>
        <Col>
          <Input
            placeholder={Languages.t(
              'scenes.app.integrations_parameters.applications_table.search_placeholder',
            )}
            onChange={e => {
              const value = e.target?.value;
              delayRequest(
                'application_search',
                async () => await searchApplicationsInTwake(value),
              );
            }}
          />
        </Col>
      </Row>
      <Divider />
      <div>
        <Table
          columns={columns}
          loading={isLoadingApplicationsList}
          dataSource={data}
          size="small"
          pagination={{ pageSize: DEFAULT_PAGE_SIZE, simple: true }}
          scroll={{ x: xs || sm ? true : undefined }}
        />
      </div>
    </>
  );
};
