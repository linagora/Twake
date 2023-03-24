import React from 'react';
import { Badge } from 'antd';

import UserService from 'app/features/users/services/current-user-service';
import Icon from 'app/components/icon/icon.js';
import Emojione from 'components/emojione/emojione';
import NotificationDelay from '../Notifications/NotificationDelay';

import './CompanyHeader.scss';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import { useCurrentWorkspace } from 'app/features/workspaces/hooks/use-workspaces';

type PropsType = {
  onClickUser?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  refDivUser: React.LegacyRef<HTMLDivElement> | undefined;
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
            {!!user.status && (
              <Emojione className="emoji-status" type={user.status.split(' ')[0]} />
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
