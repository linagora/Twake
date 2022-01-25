import React, { useState } from 'react';

import Languages from 'services/languages/languages';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import WorkspaceService from 'app/deprecated/workspaces/workspaces.js';
import groupService from 'app/deprecated/workspaces/groups.js';
import workspacesUsers from 'app/services/workspaces-user/workspaces_users';
import Switch from 'components/inputs/switch';
import workspaceUserRightsService from 'app/features/workspaces/services/workspace-user-rights-service';
import popupManager from 'services/popupManager/popupManager.js';
import './Pages.scss';
import Pending from 'app/views/client/popup/WorkspaceParameter/Pages/WorkspacePartnerTabs/Pending';
import Members from 'app/views/client/popup/WorkspaceParameter/Pages/WorkspacePartnerTabs/Members';
import { Row, Col, Button, Input, Typography, Divider } from 'antd';
import AddUserByEmail from '../../AddUser/AddUserByEmail';
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
  WorkspaceService.useListener();
  workspacesUsers.useListener();
  Languages.useListener();

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
          <Button type="primary" onClick={() => popupManager.open(<AddUserByEmail standalone />)}>
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

      <Pending filter={searchValue} />

      <Members filter={searchValue} />
    </div>
  );
};
