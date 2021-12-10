import React, { useState, useEffect } from 'react';
import { Button, Col, Row, Typography } from 'antd';
import classNames from 'classnames';
import TrashIcon from '@material-ui/icons/DeleteOutlined';

import Strings from 'app/services/utils/strings';
import UsersService from 'services/user/UserService';
import Languages from 'services/languages/languages';
import Workspaces from 'services/workspaces/workspaces.js';
import UserOrMail from '../ui/UserOrMail';
import Icon from '../Icon/Icon';
import WorkspacesUsers from 'services/workspaces/workspaces_users';
import AutoCompleteExtended from 'components/AutoCompleteExtended/AutoCompleteExtended';
import { UserType } from 'app/models/User';
import UserAPIClient from 'app/services/user/UserAPIClient';

import './UserListManager.scss';

type PropsType = {
  [key: string]: any;
};

const UserListManager = (props: PropsType) => {
  const [input, setInput] = useState<string>('');
  const [editing, setEditing] = useState<boolean>(props.autoFocus ? props.autoFocus : false);
  const [usersIds, setUsersIds] = useState<string[]>([...props.users]);
  let savedUserProps: string;

  useEffect(() => {
    updateStateFromProps(props, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStateFromProps = (props: PropsType, force?: boolean) => {
    let anti_duplicates: string[] = [];

    const user_ids = props.users
      .map((item: any) => item.id || item)
      .filter((item: string) => {
        const here = anti_duplicates.indexOf(item) < 0;
        anti_duplicates.push(item);
        return here;
      });

    if (force || JSON.stringify(user_ids) !== savedUserProps) {
      setUsersIds([...user_ids]);
      savedUserProps = JSON.stringify(user_ids);
    }
  };

  const filter = (text: string, callback: (arr: any[]) => any) => {
    setInput(text);
    if ((text || '').indexOf('@') > 0) {
      if (
        props.allowMails &&
        Strings.verifyMail(text) &&
        usersIds.indexOf(text.toLocaleLowerCase()) < 0
      ) {
        callback([{ email: text.toLocaleLowerCase() }]);
        return;
      }
      callback([]);
      return;
    }
    UserAPIClient.search(
      text,
      {
        scope: props.scope,
        companyId: Workspaces.currentGroupId,
        workspaceId: Workspaces.currentWorkspaceId,
      },
      (res: any) => {
        res = res.filter((el: any) => !!el);
        callback(
          res.filter((item: any) => {
            if (
              (props.hideUsersIds || []).indexOf(item.id) >= 0 ||
              usersIds.indexOf(item.id) >= 0 ||
              usersIds.indexOf(item) >= 0
            ) {
              return false;
            }
            return true;
          }),
        );
      },
    );
  };

  const renderLine = (item: any, added?: boolean): JSX.Element => {
    if (!item) {
      return <></>;
    }

    if (item.email && !item.username) {
      item = item.email;
    }

    const id = item.id || item;
    let button: JSX.Element = <></>;

    if (added && !props.readOnly) {
      if (id !== UsersService.getCurrentUserId() || props.canRemoveMyself) {
        button = (
          <Col className="more">
            <TrashIcon
              key={`user_${id}`}
              className="m-icon-small remove"
              onClick={() => {
                const filteredList = usersIds.filter((id: any) =>
                  typeof item === 'string' ? item !== id : item.id !== id,
                );

                if (props.onUpdate) props.onUpdate(filteredList);
                return setUsersIds(filteredList);
              }}
            />
          </Col>
        );
      }
    }

    return (
      <>
        <UserOrMail item={item} />
        {button}
      </>
    );
  };

  const select = (id: string) => {
    if (!id) {
      return;
    }

    if (!usersIds.includes(id)) {
      const newArr = usersIds.length > 0 ? [...usersIds, id] : [id];
      setUsersIds(newArr);
      setInput('');
      if (props.onUpdate) props.onUpdate(newArr);
    }
  };

  return (
    <div
      className={classNames(['userListManager', 'menu-cancel-margin'], {
        collapsed: props.collapsed,
        big: props.big,
        medium: props.medium,
        small: props.small,
      })}
    >
      {usersIds.length > 0 && (
        <div className={'users-list no-background'}>
          {usersIds.map((item: string, index: number) => (
            <div key={index} style={props.collapsed ? { display: 'inline-block' } : {}}>
              <Row align="middle" gutter={[8, 8]}>
                {renderLine(item, true)}
              </Row>
            </div>
          ))}
        </div>
      )}
      {usersIds.length === 0 && !props.noPlaceholder && (
        <div className="no-users">{Languages.t('components.userlistmanager.no_users')}</div>
      )}
      {!props.readOnly && (
        <div className="add-user-input">
          {!editing && (
            <Typography.Link
              className="small secondary-text right-margin"
              onClick={() => setEditing(true)}
            >
              <Icon type={props.buttonIcon || 'plus'} className="m-icon-small" />{' '}
              {props.buttonText ||
                Languages.t('scenes.apps.parameters.workspace_sections.members.invite_btn')}
            </Typography.Link>
          )}
          {!!editing && (
            <AutoCompleteExtended
              maxItems={props.maxResults || 5}
              align={props.onTop ? 'top' : 'bottom'}
              disabled={props.disabled || false}
              size={'large'}
              value={input}
              onSelect={select}
              style={{ width: '100%' }}
              placeholder={
                props.inputText ||
                Languages.t('scenes.apps.parameters.workspace_sections.members.invite_btn')
              }
              autoFocus
              onSearch={(text, cb) => filter(text, cb)}
              render={(user: UserType) => (
                <Row align="middle" gutter={[8, 8]}>
                  <UserOrMail item={user} />
                </Row>
              )}
            />
          )}
          {!!props.showAddMe && usersIds.indexOf(UsersService.getCurrentUser().id) < 0 && (
            <Typography.Link
              className="small primary-text right-margin"
              onClick={() => select(UsersService.getCurrentUser().id)}
            >
              <Icon type="user" className="m-icon-small" />{' '}
              {Languages.t('components.users_picker.add_me')}
            </Typography.Link>
          )}
          {!!props.showAddAll &&
            Object.keys(WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId) || {})
              .length > usersIds.length &&
            Workspaces.getCurrentWorkspace().stats.total_members < 30 && (
              <Button
                className="small primary-text"
                onClick={() => {
                  Object.keys(
                    WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId) || {},
                  ).map(id =>
                    select(
                      (WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId)[id] || {})
                        .user,
                    ),
                  );
                }}
              >
                <Icon type="users-alt" className="m-icon-small" />{' '}
                {Languages.t('scenes.apps.parameters.workspace_sections.members.invite_all')}
              </Button>
            )}
        </div>
      )}
      {(props.onCancel || props.onChange) && (
        <div className="menu-custom" style={{ height: 40 }}>
          {props.onCancel && (
            <Button
              value={Languages.t('general.cancel')}
              className="secondary"
              style={{ float: 'left' }}
              onClick={() => {
                if (props.onCancel) {
                  props.onCancel();
                }
                setUsersIds(props.users.map((item: any) => item.id));
              }}
            />
          )}
          {props.onChange && (
            <Button
              style={{ float: 'right' }}
              value={props.continueText || Languages.t('scenes.apps.messages.message.save_button')}
              onClick={() => props.onChange(usersIds)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default UserListManager;
