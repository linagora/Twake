// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { Avatar, Badge, Skeleton } from 'antd';

import UserService from 'services/user/UserService';
import Icon from 'components/Icon/Icon.js';
import Emojione from 'components/Emojione/Emojione';
import NotificationDelay from '../Notifications/NotificationDelay';

import './CompanyHeader.scss';
import { useCurrentUser } from 'app/state/recoil/hooks/useCurrentUser';
import { useCurrentWorkspace } from 'app/state/recoil/hooks/useWorkspaces';

type PropsType = {
  onClickUser?: (event: any) => void;
  refDivUser: any;
};

export default (props: PropsType): JSX.Element => {
  const { user } = useCurrentUser();
  const { workspace } = useCurrentWorkspace();

  return (
    <div className="current-company-header">
      <div
        ref={props.refDivUser}
        className="current-company"
        onClick={evt => props.onClickUser && props.onClickUser(evt)}
      >
        <div className="name">
          <div className="text">{workspace?.name || '-'}</div>
          <div className="icon">
            <Icon type="angle-down" />
          </div>
        </div>

        {user && (
          <div className="user-info">
            <Badge count={1} size="small" dot color="green" />
            {!!(user.status || [])[0] && user.status ? (
              <Emojione className="emoji-status" type={user.status.split(' ')[0]} />
            ) : (
              <Avatar size={16} src={UserService.getThumbnail(user)} />
            )}

            <span className="text">
              {UserService.getFullName(user)} ({user.email})
            </span>
          </div>
        )}
      </div>
      <div className="notifications">
        <NotificationDelay />
      </div>
    </div>
  );
};
