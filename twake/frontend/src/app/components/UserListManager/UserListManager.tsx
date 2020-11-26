import React, { FC, useState, useEffect } from 'react';
import UsersService from 'services/user/user.js';
import { UserType } from 'app/models/User';
import { AutoComplete, Avatar, Col, Row, Typography } from 'antd';
import Workspaces from 'services/workspaces/workspaces.js';
import TrashIcon from '@material-ui/icons/DeleteOutlined';
import UserOrMail from 'components/ui/UserOrMail.js';
import AutoCompleteExtended from 'components/AutoCompleteExtended/AutoCompleteExtended';
import './UserListManager.scss';

type Props = {
  [key: string]: any;
};

const { Option } = AutoComplete;
const { Text } = Typography;

const UserListManager: FC<Props> = props => {
  const [SelectedUsersList, _setSelectedUsersList] = useState<string[]>([]);

  const onSearchUsers = (text: string, callback: any) => {
    return UsersService.search(
      text,
      {
        scope: props.scope,
        workspace_id: Workspaces.currentWorkspaceId,
        group_id: Workspaces.currentGroupId,
      },
      (res: any) => {
        res = res.filter(
          (object: UserType) => !!object && SelectedUsersList.indexOf(object.id || '') < 0,
        );
        callback(res);
      },
    );
  };

  const onUpdate = (array: string[]) => props.onUpdate(array);

  const setSelectedUsersList = (value: any) => {
    _setSelectedUsersList(value);
    onUpdate(value);
  };

  return (
    <>
      {SelectedUsersList &&
        SelectedUsersList.map((id, index) => {
          if (index >= 0) {
            return (
              <Row key={`user_${id}`} justify="space-between" gutter={[0, 0]}>
                <UserOrMail key={`user_${id}`} item={{ id }} />
                {props.canRemoveMyself && (
                  <div className="more">
                    <TrashIcon
                      key={`user_${id}`}
                      className="m-icon-small remove"
                      onClick={() => {
                        const filteredUserList = SelectedUsersList.filter(item =>
                          typeof item == 'string' ? id != item : id != item,
                        );
                        return setSelectedUsersList(filteredUserList);
                      }}
                    />
                  </div>
                )}
              </Row>
            );
          }
        })}
      {!SelectedUsersList.length && <div className="small-top-margin"></div>}
      <AutoCompleteExtended
        align="top"
        size={'large'}
        onSelect={(id: string) => {
          return SelectedUsersList.includes(id)
            ? false
            : setSelectedUsersList([...SelectedUsersList, id]);
        }}
        style={{ width: '100%' }}
        placeholder="Search users"
        onSearch={(text: string, callback: (results: UserType[]) => void) =>
          onSearchUsers(text, (res: UserType[]) => {
            callback(res);
          })
        }
        render={(user: UserType) => (
          <Row align="middle" gutter={[8, 0]}>
            <Col>
              <Avatar size={20} src={UsersService.getThumbnail(user)} />
            </Col>
            <Col>
              <Text strong>
                {UsersService.getFullName(user)}, {user.email}
              </Text>
            </Col>
          </Row>
        )}
      />
    </>
  );
};

export default UserListManager;
