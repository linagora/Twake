import React, { useEffect, useState } from 'react';
import Languages from 'services/languages/languages';
import { Divider, Table, Typography } from 'antd';
import Menu from 'components/Menus/Menu.js';
import workspaceUserRightsService from 'services/workspaces/WorkspaceUserRights';
import EditIcon from '@material-ui/icons/MoreHorizOutlined';
import { ColumnsType } from 'antd/lib/table';
import Api from 'app/services/Api';
import RouterServices from 'services/RouterService';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';

type PendingEmailResourceType = {
  company_role: string;
  email: string;
  role: string;
};

type ColumnObjectType = { key: number } & PendingEmailResourceType;

export default (props: { filter: string }) => {
  const { workspaceId, companyId } = RouterServices.useRouteState();
  const prefixRoute = '/internal/services/workspaces/v1';
  const DEFAULT_PAGE_SIZE = 5;

  const [loading, setLoading] = useState<boolean>(false);
  const [data, _setData] = useState<ColumnObjectType[]>([]);
  const [filteredData, setFilteredData] = useState<ColumnObjectType[] | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { xs, sm, md, lg, xl } = useBreakpoint();

  useEffect(() => {
    refreshPendingEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.filter, data]);

  const refreshPendingEmails = async () => {
    const pendingEmailRoute = `${prefixRoute}/companies/${companyId}/workspaces/${workspaceId}/pending/email`;

    try {
      setLoading(true);
      await Api.get(pendingEmailRoute, setData);
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const deletePendingEmail = (col: ColumnObjectType) => {
    const removePendingEmailRoute = `/internal/services/workspaces/v1/companies/${companyId}/workspaces/${workspaceId}/pending/${col.email}`;
    setLoading(true);
    Api.delete(removePendingEmailRoute).finally(() => {
      refreshPendingEmails();
      setLoading(false);
    });
  };

  const setData = (res: any) => {
    const resources: PendingEmailResourceType[] = res.resources;
    if (resources) {
      _setData(resources.map((o, key) => ({ key: key + 1, ...o })));
    }
  };

  const onSearch = () => {
    if (props.filter.length) {
      const filteredData = data.filter(col =>
        (col.email || '').toLocaleLowerCase().includes(props.filter.toLocaleLowerCase()),
      );
      setFilteredData(filteredData);
    } else {
      setFilteredData(null);
    }
  };

  const columns: ColumnsType<ColumnObjectType> = [
    {
      title: Languages.t('general.email'),
      dataIndex: 'email',
      width: 200,
    },

    {
      title: '',
      dataIndex: 'menu',
      width: 50,
      render: (text, col, index) => {
        if (!workspaceUserRightsService.hasWorkspacePrivilege()) {
          return;
        }
        return (
          <div className="action">
            <Menu
              className="option_button"
              style={{ padding: 4 }}
              menu={[
                {
                  type: 'menu',
                  className: 'danger',
                  text: Languages.t('scenes.app.popup.workspaceparameter.pages.cancel_invitation'),
                  onClick: () => deletePendingEmail(col),
                },
              ]}
            >
              <EditIcon className="m-icon-small" />
            </Menu>
          </div>
        );
      },
    },
  ];

  if (data.length === 0) {
    return null;
  }

  return (
    <>
      <Divider />
      <div>
        <Typography.Title level={3}>
          {Languages.t('scenes.apps.parameters.workspace_sections.members.pending')}
        </Typography.Title>
        <Table
          columns={columns}
          loading={loading}
          dataSource={filteredData ? filteredData : data}
          size="small"
          pagination={{ pageSize: DEFAULT_PAGE_SIZE, simple: true }}
          scroll={{ x: xs || sm ? true : undefined }}
        />
      </div>
    </>
  );
};
