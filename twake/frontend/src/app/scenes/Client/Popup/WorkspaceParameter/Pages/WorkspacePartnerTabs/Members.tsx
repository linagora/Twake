import React, { useState, useEffect } from 'react';
import Languages from 'services/languages/languages';
import { Table, Row, Col, Typography, Divider } from 'antd';
import AlertManager from 'services/AlertManager/AlertManager';
import EditIcon from '@material-ui/icons/MoreHorizOutlined';
import Menu from 'components/Menus/Menu.js';
import { ColumnsType } from 'antd/lib/table';
import UserService from 'services/user/UserService';
import workspacesUsers from 'services/workspaces/workspaces_users';
import workspaceUserRightsService from 'services/workspaces/WorkspaceUserRights';
import InitService from 'app/services/InitService';
import RouterServices from 'services/RouterService';
import { ChevronUp, ChevronsUp } from 'react-feather';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';
import Api from 'app/services/Api';
import ConsoleService from 'app/services/Console/ConsoleService';
import WorkspaceService from 'services/workspaces/workspaces.js';
import _ from 'lodash';
import { delayRequest } from 'app/services/utils/managedSearchRequest';

type ColumnObjectType = { [key: string]: any };

const RoleComponent = ({ text, icon }: { text: string; icon?: JSX.Element }): JSX.Element => (
  <Row justify="center" align="middle">
    {!!icon && (
      <Col pull={1} style={{ height: 16 }}>
        {icon}
      </Col>
    )}
    <Col>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {text}
      </Typography.Text>
    </Col>
  </Row>
);

export default ({ filter }: { filter: string }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<ColumnObjectType[]>([]);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [serverSearchedData, setServerSearchedData] = useState<ColumnObjectType[]>([]);
  const [filteredData, setFilteredData] = useState<ColumnObjectType[] | null>(null);
  const { workspaceId, companyId } = RouterServices.useRouteState();
  const prefixRoute = '/internal/services/workspaces/v1';
  const workspaceUsersRoute = `${prefixRoute}/companies/${companyId}/workspaces/${workspaceId}/users`;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { xs, sm, md, lg, xl } = useBreakpoint();

  useEffect(() => {
    requestWorkspaceUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, data]);

  const onSearch = async () => {
    if (filter.length) {
      delayRequest('workspace_members_search', async () => {
        try {
          setLoading(true);
          await Api.get(workspaceUsersRoute + `?search=${filter}`, (res: any) => {
            const resources: ColumnObjectType[] = res.resources;

            // Make sure we have unicity in this combined list
            setServerSearchedData(
              _.uniqBy([...serverSearchedData, ...(resources || [])], col => col.user.id),
            );
            updateFilteredData();
          });
          setLoading(false);
        } catch (e) {
          console.error(e);
        }
      });
    }
    updateFilteredData();
  };

  const updateFilteredData = () => {
    if (filter.length) {
      // Make sure we have unicity in this combined list
      const filtered = _.uniqBy([...data, ...serverSearchedData], col => col.user.id).filter(col =>
        `${col.user.email} ${UserService.getFullName(col.user)}`
          .toLocaleLowerCase()
          .includes(filter.toLocaleLowerCase()),
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(null);
    }
  };

  const requestWorkspaceUsers = async (pageToken?: string) => {
    try {
      setLoading(true);
      const res = (await Api.get(
        `${workspaceUsersRoute}?limit=25${pageToken ? `&page_token=${pageToken}` : ''}`,
      )) as any;
      setPageToken(res.next_page_token || null);
      if (res.resources)
        setData(pageToken ? _.uniqBy([...data, ...res.resources], col => col.id) : res.resources);
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const updateData = (updater: (data: ColumnObjectType[]) => ColumnObjectType[]) => {
    setData(updater(data));
    setFilteredData(filteredData !== null ? updater(filteredData || []) : null);
    setServerSearchedData(updater(serverSearchedData));
  };

  const updateWorkspaceUserRole = async (col: { [key: string]: any }) => {
    const workspaceUserRole = `${prefixRoute}/companies/${col.company_id}/workspaces/${col.workspace_id}/users/${col.user_id}`;

    setLoading(true);
    const res: any = await Api.post(workspaceUserRole, {
      resource: {
        role: col.role === 'moderator' ? 'member' : 'moderator',
      },
    });

    if (res.resource) {
      updateData(data =>
        data.map(d => (d.user_id === col.user_id ? (res.resource as ColumnObjectType) : d)),
      );
    }

    setLoading(false);
  };

  const deleteWorkspaceUser = (col: { [key: string]: any }) =>
    AlertManager.confirm(() => {
      const deleteWorkspaceUser = `${prefixRoute}/companies/${col.company_id}/workspaces/${col.workspace_id}/users/${col.user_id}`;

      setLoading(true);
      Api.delete(deleteWorkspaceUser, {}, (res: any) => {
        updateData(data => data.filter(d => d.user_id !== col.user_id));
        setLoading(false);
      });
    });

  const leaveWorkspace = (col: any) => {
    workspacesUsers.leaveWorkspace();
  };

  const buildMenu = (col: any) => {
    let menu: any[] = [];

    if (
      workspaceUserRightsService.hasGroupPrivilege() &&
      InitService.server_infos?.configuration?.accounts.type === 'console'
    ) {
      menu.push({
        type: 'menu',
        text: Languages.t('scenes.app.popup.workspaceparameter.edit_from_console', []),
        onClick: () =>
          window.open(
            ConsoleService.getCompanyUsersManagementUrl(WorkspaceService.currentGroupId),
            '_blank',
          ),
      });
    }

    if (col.user_id === UserService.getCurrentUserId()) {
      menu.push({
        type: 'menu',
        text: Languages.t('scenes.app.popup.workspaceparameter.pages.quit_workspace_menu'),
        className: 'error',
        onClick: () => {
          leaveWorkspace(col);
        },
      });
    } else if (workspaceUserRightsService.hasWorkspacePrivilege()) {
      menu.push(
        workspaceUserRightsService.hasWorkspacePrivilege() && {
          type: 'menu',
          text: col.role === 'moderator' ? 'Set to workspace member' : `Set to workspace moderator`,
          onClick: () => updateWorkspaceUserRole(col),
        },
      );
      menu.push({
        type: 'menu',
        text: Languages.t('scenes.app.popup.workspaceparameter.pages.withdraw_button'),
        className: 'error',
        onClick: () => deleteWorkspaceUser(col),
      });
    }

    return (
      <div className="action">
        {menu.length > 0 && (
          <Menu className="option_button" style={{ paddingTop: 8, paddingRight: 8 }} menu={menu}>
            <EditIcon className="m-icon-small" />
          </Menu>
        )}
      </div>
    );
  };

  const setRoleTitle = ({
    companyRole,
    workspaceRole,
  }: {
    companyRole: string;
    workspaceRole: string;
  }) => {
    // Company
    switch (companyRole) {
      case 'owner':
        return (
          <RoleComponent
            text={Languages.t('scenes.app.popup.appsparameters.pages.company_label')}
            icon={<ChevronsUp size={16} style={{ padding: 0 }} />}
          />
        );
      case 'admin':
        return (
          <RoleComponent
            text={Languages.t('general.user.role.company.admin')}
            icon={<ChevronsUp size={16} style={{ padding: 0 }} />}
          />
        );
      case 'guest':
        return <RoleComponent text={Languages.t('general.user.role.company.guest')} />;
    }

    // Workspace
    if (workspaceRole === 'moderator') {
      return (
        <RoleComponent
          text={Languages.t('scenes.app.popup.workspaceparameter.pages.moderator_status')}
          icon={<ChevronUp size={16} style={{ padding: 0 }} />}
        />
      );
    }
  };

  const columns: ColumnsType<ColumnObjectType> = [
    {
      title: Languages.t('scenes.app.popup.workspaceparameter.pages.table_title'),
      dataIndex: 'name',
      render: (text, col, index) => {
        const fullName = UserService.getFullName(col.user);
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className="user_image"
              style={{
                backgroundImage: `url(${UserService.getThumbnail(col.user)})`,
              }}
            />

            {fullName.length > 0 && (
              <Typography.Text className="small-right-margin">{fullName}</Typography.Text>
            )}

            {col.user.email && <Typography.Text type="secondary">{col.user.email}</Typography.Text>}
          </div>
        );
      },
    },
    {
      title: Languages.t(
        'scenes.app.popup.workspaceparameter.pages.workspace_partner_tabs.members.table.tags',
      ),
      dataIndex: 'tags',
      render: (text, col, index) => (
        <Typography.Text type="secondary">
          {setRoleTitle({
            companyRole: UserService.getUserRole(col.user, companyId),
            workspaceRole: col.role,
          })}
        </Typography.Text>
      ),
    },
    {
      title: '',
      dataIndex: 'menu',
      width: 50,
      render: (text, col, index) =>
        workspaceUserRightsService.hasWorkspacePrivilege() && buildMenu(col),
    },
  ];

  return (
    <>
      <Divider />
      <div>
        <Typography.Title level={3}>
          {Languages.t('scenes.apps.parameters.workspace_sections.members.members')}
        </Typography.Title>
        <Table<ColumnObjectType>
          columns={columns}
          loading={loading}
          size="small"
          pagination={false}
          dataSource={filteredData ? filteredData : data}
          scroll={{ x: xs || sm ? true : undefined }}
        />
        {pageToken !== null && pageToken.length && (
          <Row justify="center" align="middle" className="small-y-margin">
            <Typography.Link onClick={() => requestWorkspaceUsers(pageToken)}>
              {Languages.t('components.searchpopup.load_more')}
            </Typography.Link>
          </Row>
        )}
      </div>
    </>
  );
};
