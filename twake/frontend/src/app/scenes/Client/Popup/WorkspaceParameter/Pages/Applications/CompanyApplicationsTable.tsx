import React, { useEffect, useRef, useState } from 'react';

import { MoreHorizontal } from 'react-feather';
import { ColumnsType } from 'antd/lib/table';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';
import { Avatar, Image, Divider, Table, Typography, Row, Col, Button } from 'antd';

//import Languages from 'services/languages/languages';
import { Application } from 'app/models/App';

import ModalManager from 'app/components/Modal/ModalManager';
import MenuManager from 'app/components/Menus/MenusManager';
import AvatarComponent from 'app/components/Avatar/Avatar';
import { useCurrentCompany } from 'app/state/recoil/hooks/useCurrentCompany';
import { useCurrentCompanyApplications } from 'app/state/recoil/hooks/useCurrentCompanyApplications';
import CompanyApplicationPopup from './CompanyApplicationPopup';

import './ApplicationsStyles.scss';

type ColumnObjectType = { key: number } & Application;

const DEFAULT_PAGE_SIZE = 5;

export default () => {
  const [company] = useCurrentCompany();

  if (!company?.id) return <></>;

  const menuBtnRef = useRef<HTMLElement>();

  const { companyApplications, isLoadingCompanyApplications, deleteOneCompanyApplication } =
    useCurrentCompanyApplications(company?.id);
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

  const buildMenu = (e: React.MouseEvent<HTMLElement, MouseEvent>, application: Application) => {
    e.stopPropagation();

    MenuManager.openMenu(
      [
        {
          type: 'menu',
          text: 'Show',
          onClick: () =>
            ModalManager.open(
              <CompanyApplicationPopup
                application={application}
                companyId={company.id}
                shouldDisplayButton={false}
              />,
              {
                position: 'center',
                size: { width: '600px' },
              },
            ),
        },
        {
          type: 'menu',
          className: 'error',
          text: 'Remove from the company',
          onClick: () => deleteOneCompanyApplication(application.id),
        },
      ],
      (window as any).getBoundingClientRect(menuBtnRef.current),
      null,
      { margin: 0 },
    );
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
      title: 'Name', // TODO translation here
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
      render: (initialValue: any, record: ColumnObjectType, index: number) => {
        const { key, ...application } = record;
        return (
          <Button
            key={key}
            ref={node => node && (menuBtnRef.current = node)}
            type="default"
            icon={<MoreHorizontal size={18} />}
            onClick={e => buildMenu(e, application)}
            className="applications-table-actions-btn"
          />
        );
      },
    },
  ];

  return (
    <div className="bottom-margin">
      <Divider />
      <Row justify="start" wrap={false}>
        <Col>
          {/* // TODO translation here */}
          <Typography.Title level={3}>Installed in your company</Typography.Title>
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
