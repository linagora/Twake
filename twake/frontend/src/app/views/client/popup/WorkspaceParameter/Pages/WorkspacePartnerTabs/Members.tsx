import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import Languages from 'app/features/global/services/languages-service';
import { Table, Row, Col, Typography, Divider } from 'antd';
import AlertManager from 'app/features/global/services/alert-manager-service';
import EditIcon from '@material-ui/icons/MoreHorizOutlined';
import Menu from 'components/menus/menu.js';
import { ColumnsType } from 'antd/lib/table';
import UserService from 'app/features/users/services/current-user-service';
import workspacesUsers from 'app/features/workspace-members/services/workspace-members-service';
import workspaceUserRightsService from 'app/features/workspaces/services/workspace-user-rights-service';
import InitService from 'app/features/global/services/init-service';
import { ChevronUp, ChevronsUp } from 'react-feather';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';
import Api from 'app/features/global/framework/api-service';
import ConsoleService from 'app/features/console/services/console-service';
import WorkspaceService from 'app/deprecated/workspaces/workspaces.js';
import { delayRequest } from 'app/features/global/utils/managedSearchRequest';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import Icon from 'app/components/icon/icon';
import UserAPIClient from 'app/features/users/api/user-api-client';
import { WorkspaceUserType } from 'app/features/workspaces/types/workspace';
import { useSetUserList } from 'app/features/users/hooks/use-user-list';
import {
  searchBackend,
  searchFrontend,
  useSearchUserList,
} from 'app/features/users/hooks/use-search-user-list';

type ColumnObjectType = { [key: string]: any };

const { Link, Text, Title } = Typography;

const RoleComponent = ({ text, icon }: { text: string; icon?: JSX.Element }): JSX.Element => (
  <Row align="middle">
    {!!icon && (
      <Col pull={1} style={{ height: 16 }}>
        {icon}
      </Col>
    )}
    <Col>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {text}
      </Text>
    </Col>
  </Row>
);

export default ({ filter }: { filter: string }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<ColumnObjectType[]>([]);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [serverSearchedData, setServerSearchedData] = useState<ColumnObjectType[]>([]);
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();

  const { search, result } = useSearchUserList({ scope: 'workspace' });

  const prefixRoute = '/internal/services/workspaces/v1';
  const workspaceUsersRoute = `${prefixRoute}/companies/${companyId}/workspaces/${workspaceId}/users`;

  const { set: setUserList } = useSetUserList('Members');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { xs, sm, md, lg, xl } = useBreakpoint();

  useEffect(() => {
    requestWorkspaceUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    delayRequest('workspace_partners_search', () => search(filter));
  }, [filter]);

  const filteredData: WorkspaceUserType[] | null = filter
    ? (result
        .map(u => ({
          user: u,
          ...u,
          role: u.workspaces?.find(w => w.id === workspaceId)?.role,
          user_id: u.id || '',
          workspace_id: workspaceId || '',
        }))
        .slice(0, 50) as WorkspaceUserType[])
    : null;

  const requestWorkspaceUsers = async (pageToken?: string) => {
    try {
      setLoading(true);

      const res = (await Api.get(
        `${workspaceUsersRoute}?limit=25${pageToken ? `&page_token=${pageToken}` : ''}`,
      )) as { resources: WorkspaceUserType[]; next_page_token: string };
      setPageToken(res.next_page_token || null);
      if (res.resources) {
        setData(pageToken ? _.uniqBy([...data, ...res.resources], col => col.id) : res.resources);
        setUserList(
          res.resources.map(wsUser => ({
            ...wsUser.user,
            workspaces: [{ id: workspaceId, company_id: companyId }],
          })),
        );
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const updateData = (updater: (data: ColumnObjectType[]) => ColumnObjectType[]) => {
    setData(updater(data));
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
      Api.delete(deleteWorkspaceUser, (res: any) => {
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

  const getRoleTitle = ({
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

            {fullName.length > 0 && <Text className="small-right-margin">{fullName}</Text>}

            {col.user.email && <Text type="secondary">{col.user.email}</Text>}
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
        <Text type="secondary">
          {getRoleTitle({
            companyRole: UserService.getUserRole(col.user, companyId),
            workspaceRole: col.role,
          })}
        </Text>
      ),
    },
    {
      title: '',
      dataIndex: 'menu',
      width: 50,
      render: (text, col, index) =>
        false && workspaceUserRightsService.hasWorkspacePrivilege() && buildMenu(col),
    },
  ];

  return (
    <>
      <div>
        {InitService.server_infos?.configuration?.accounts.type === 'console' && (
          <Link
            style={{ float: 'right' }}
            href="#"
            onClick={() => {
              window.open(
                ConsoleService.getCompanyUsersManagementUrl(WorkspaceService.currentGroupId),
                '_blank',
              );
            }}
          >
            <Icon type="external-link-alt" className="m-icon-small" />{' '}
            {Languages.t(
              'views.client.popup.workspace_parameter.pages.workspace_members.link_to_console',
            )}
          </Link>
        )}

        <Title level={3}>
          {Languages.t('scenes.apps.parameters.workspace_sections.members.members')}
        </Title>

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
            <Link onClick={() => requestWorkspaceUsers(pageToken)}>
              {Languages.t('components.searchpopup.load_more')}
            </Link>
          </Row>
        )}
      </div>
    </>
  );
};
