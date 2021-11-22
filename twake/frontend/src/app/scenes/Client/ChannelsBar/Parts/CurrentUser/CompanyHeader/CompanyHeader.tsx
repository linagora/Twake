// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { Skeleton } from 'antd';

import UserService from 'services/user/UserService';
import Icon from 'components/Icon/Icon.js';
import Emojione from 'components/Emojione/Emojione';
import NotificationDelay from '../Notifications/NotificationDelay';
import useCurrentUser from 'app/services/user/hooks/useCurrentUser';
import { SkeletonTitleProps } from 'antd/lib/skeleton/Title';
import { SkeletonParagraphProps } from 'antd/lib/skeleton/Paragraph';

import './CompanyHeader.scss';

type PropsType = {
  companyName: string;
  onClickUser?: (event: any) => void;
  refDivUser: any;
};

export default (props: PropsType): JSX.Element => {
  const user = useCurrentUser();

  return (
    <div className="current-company-header">
      <div
        ref={props.refDivUser}
        className="current-company"
        onClick={evt => props.onClickUser && props.onClickUser(evt)}
      >
        <div className="name">
          <div className="text">{props.companyName}</div>
          <div className="icon">
            <Icon type="angle-down" />
          </div>
        </div>

        { user &&
          <div className="user-info">
            {!!(user.status_icon || [])[0] && <Emojione type={user.status_icon![0]} />}

            <span className="text">
              {UserService.getFullName(user)} ({user.email})
            </span>
          </div>
        }
      </div>
      <div className="notifications">
        <NotificationDelay />
      </div>
    </div>
  );
};

export const LoadingCompany = () => {
  const workspace_name_loading : SkeletonTitleProps = {style: {height:28}, width: "40%"}
  const user_mail_loading : SkeletonParagraphProps = {rows: 1, width: "100%"}
  return (
    <div className="current_company_header_loader ">
      <div className="current_company_loader small-x-margin">
        <Skeleton title={workspace_name_loading} paragraph={false}/>
        <Skeleton title={false} paragraph={user_mail_loading}/>  
      </div>
    </div>
  );
};