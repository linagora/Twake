import React, { useState } from 'react';
import { Button, Typography } from 'antd';
import Languages from 'services/languages/languages.js';
import UserListManager from 'app/components/UserListManager/UserListManager';
import './AddUser.scss';
import Emojione from 'app/components/Emojione/Emojione';
import InitService from 'app/services/InitService';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import { UserType } from 'app/models/User';
import workspacesUsersService from 'services/workspaces/workspaces_users.js';
import popupManager from 'services/popupManager/popupManager.js';

type PropsType = {
  [key: string]: any;
};

const AddUserFromTwakeConsole = (props: PropsType) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [disabled, setDisabled] = useState(false);

  const onClickBtn = () => {
    let emails: string[] = [];
    selectedUsers.map((id: string) => {
      const user: UserType = Collections.get('users').find(id);
      if (user.email) return emails.push(user.email);
    });
    if (props.onChange) props.onChange(emails);
    return finish(emails);
  };

  const finish = (emails: string[]) => {
    if (!disabled) {
      setDisabled(true);
      if (props.standalone) {
        workspacesUsersService.addUser(
          emails,
          () => {
            close();
          },
          null,
        );
      } else if (props.finish) {
        props.finish();
        close();
      }
    }
  };

  const close = () => {
    if (props.inline) {
      return;
    }
    setTimeout(() => {
      popupManager.close();
    }, 200);
  };

  const onClickLink = () => {
    if (InitService.server_infos?.auth?.console?.use) {
      return window.open(
        InitService.server_infos?.auth?.console?.collaborators_management_url,
        '_blank',
      );
    }
  };
  return (
    <div className="add-user-from-twake-console">
      <Typography.Title level={3} className="">
        {Languages.t('scenes.app.workspaces.create_company.invitations.title_2')}{' '}
        <Emojione type=":upside_down:" />
      </Typography.Title>
      <div className="user-list-container">
        <UserListManager
          max={10}
          users={[]}
          canRemoveMyself
          noPlaceholder
          scope="group"
          autoFocus
          onUpdate={(ids: string[]) => setSelectedUsers(ids)}
        />
      </div>
      <div className="current-user-state small-text">
        {Languages.t('scenes.app.popup.adduserfromtwakeconsole.current_users_state', [
          selectedUsers.length || 0,
        ])}
        <div className="small-y-margin smalltext">
          <span style={{ opacity: 0.5 }}>
            {Languages.t('scenes.app.popup.adduserfromtwakeconsole.description')}{' '}
          </span>
          <Typography.Link onClick={onClickLink}>
            {Languages.t('general.app.popup.adduserfromtwakeconsole.description_link')}
          </Typography.Link>
        </div>
      </div>
      <div className="add-user-button-container">
        <Button type="primary" onClick={onClickBtn} disabled={disabled}>
          {selectedUsers.length === 0
            ? Languages.t('scenes.app.workspaces.components.skip')
            : Languages.t('general.add')}
        </Button>
      </div>
    </div>
  );
};

export default AddUserFromTwakeConsole;
