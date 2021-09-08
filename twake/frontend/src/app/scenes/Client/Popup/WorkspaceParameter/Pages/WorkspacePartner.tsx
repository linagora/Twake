import React, { Component, useEffect, useState } from 'react';

import Languages from 'services/languages/languages';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import WorkspaceService from 'services/workspaces/workspaces.js';
import groupService from 'services/workspaces/groups.js';
import workspacesUsers from 'services/workspaces/workspaces_users';
import Menu from 'components/Menus/Menu.js';
import AlertManager from 'services/AlertManager/AlertManager';
import EditIcon from '@material-ui/icons/MoreHorizOutlined';
import Switch from 'components/Inputs/Switch';
import workspaceUserRightsService from 'services/workspaces/WorkspaceUserRights';
import UserService from 'services/user/UserService';
import CreateCompanyAccount from './CreateCompanyAccount.js';
import MediumPopupManager from 'app/components/Modal/ModalManager';
import popupManager from 'services/popupManager/popupManager.js';
import './Pages.scss';
import Pending from 'app/scenes/Client/Popup/WorkspaceParameter/Pages/WorkspacePartnerTabs/Pending';
import Members from 'app/scenes/Client/Popup/WorkspaceParameter/Pages/WorkspacePartnerTabs/Members';
import Tabs from 'components/Tabs/Tabs.js';
import InitService from 'app/services/InitService';
import ConsoleService from 'app/services/Console/ConsoleService';
import RouterServices from 'services/RouterService';
// import { Switch } from 'antd';
import { UserType } from 'app/models/User.js';
import Api from 'app/services/Api';
import { Table, Row, Col, Button, Input, Typography, Divider } from 'antd';
import AddUserFromTwakeConsole from '../../AddUser/AddUserFromTwakeConsole';
import { Search } from 'react-feather';

export const AdminSwitch = (props: { col: any; adminLevelId: string; onChange: any }) => {
  workspacesUsers.useListener(useState);
  const loading = workspacesUsers.updateLevelUserLoading[props.col.user.id];
  const checked = props.col.level === props.adminLevelId;
  return (
    <div className="editLevel">
      <Switch
        loading={loading}
        label={Languages.t('scenes.app.popup.workspaceparameter.pages.moderator_status')}
        checked={checked}
        onChange={props.onChange}
      />
    </div>
  );
};

export default () => {
  const [searchValue, setSearchValue] = useState<string>('');
  Collections.get('workspaces').useListener(useState);
  WorkspaceService.useListener(useState);
  workspacesUsers.useListener(useState);
  workspaceUserRightsService.useListener(useState);
  Languages.useListener(useState);

  const usersInGroup = [];
  Object.keys(workspacesUsers.users_by_group[groupService.currentGroupId] || {}).map(
    // eslint-disable-next-line array-callback-return
    key => {
      var user = workspacesUsers.users_by_group[groupService.currentGroupId][key].user;
      if (
        !workspacesUsers.getUsersByWorkspace(WorkspaceService.currentWorkspaceId)[key] ||
        !workspacesUsers.getUsersByWorkspace(WorkspaceService.currentWorkspaceId)[key].user ||
        !workspacesUsers.getUsersByWorkspace(WorkspaceService.currentWorkspaceId)[key].user.id
      ) {
        usersInGroup.push({
          id: user.id,
          user: user,
          externe: workspacesUsers.users_by_group[groupService.currentGroupId][key].externe,
          groupLevel:
            workspacesUsers.users_by_group[WorkspaceService.currentGroupId][key].groupLevel,
        });
      }
    },
  );

  return (
    <div className="workspaceParameter">
      <Typography.Title level={1}>
        {Languages.t('scenes.app.popup.workspaceparameter.pages.collaborateurs')}
      </Typography.Title>

      {workspacesUsers.errorOnInvitation && (
        <div className="blocError">
          {Languages.t(
            'scenes.app.popup.workspaceparameter.pages.invitation_error',
            [],
            'An error occurred while inviting the following users: ',
          )}
          <br />
          <span className="text">
            {workspacesUsers.errorUsersInvitation.filter(item => item).join(', ')}
          </span>
          <div className="smalltext">
            {Languages.t(
              'scenes.app.popup.workspaceparameter.pages.invited_guest_check_message',
              [],
              'Check that the username or e-mail used is valid.',
            )}
          </div>
        </div>
      )}

      <Divider />

      <Row className="small-y-margin" justify="space-between" align="middle">
        <Col>
          <Button
            type="primary"
            onClick={() => popupManager.open(<AddUserFromTwakeConsole standalone />)}
          >
            {Languages.t('scenes.app.popup.workspaceparameter.pages.collaboraters_adding_button')}
          </Button>
        </Col>
        <Col>
          <Input
            placeholder={Languages.t('components.listmanager.filter')}
            prefix={<Search size={16} color="var(--grey-dark)" />}
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
          />
        </Col>
      </Row>

      <Divider />

      <Pending filter={searchValue} />

      <Divider />

      <Members filter={searchValue} />
    </div>
  );
};
