import React, { useEffect, useState } from 'react';

import { Info } from 'react-feather';
import { ColumnsType } from 'antd/lib/table';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';
import { Avatar, Image, Divider, Table, Typography, Row, Input, Col, Button } from 'antd';

//import Languages from 'services/languages/languages';

import { Application } from 'app/models/App';
import ModalManager from 'app/components/Modal/ModalManager';
import { useApplications } from 'app/services/Apps/useApplications';
import { useCurrentCompanyApplications } from 'app/state/recoil/hooks/useCurrentCompanyApplications';
import { useCurrentCompany } from 'app/state/recoil/hooks/useCurrentCompany';
import CompanyApplicationPopup from './CompanyApplicationPopup';
import { delayRequest } from 'app/services/utils/managedSearchRequest';

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

  const refreshApplications = async () => {
    try {
      applicationsList && setData(applicationsList);
    } catch (e) {
      console.error(e);
    }
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
      title: 'Name', // TODO translation here
      dataIndex: 'name',
      width: 550,
      render: (
        { name, icon }: { name: string; icon: string },
        record: ColumnObjectType,
        index: number,
      ) => {
        return (
          <Row key={index} wrap={false} align="middle" justify="start">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                shape="square"
                src={<Image src={icon} style={{ width: 24, borderRadius: 4 }} preview={false} />}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
              <Typography.Text className="small-x-margin">{name}</Typography.Text>
            </div>
          </Row>
        );
      },
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
            style={{
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
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
          {/* // TODO translation here */}
          <Typography.Title level={3}>Twake Market</Typography.Title>
        </Col>
        <Col>
          <Input
            // TODO translation here
            placeholder="Search application"
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
