import React, { useContext } from 'react';
import 'moment-timezone';
import User from 'app/features/users/services/current-user-service';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import Icon from 'components/icon/icon.js';
import './threads.scss';
import { MessageContext } from '../message/message-with-replies';
import { useMessage } from 'app/state/recoil/hooks/messages/useMessage';
import {
  useRecoilState,
  useRecoilStateLoadable,
  useRecoilValue,
  useRecoilValueLoadable,
} from 'recoil';
import { CompanyApplicationsStateFamily } from 'app/state/recoil/atoms/CompanyApplications';
import { UsersState } from 'app/features/users/state/atoms/users';

type Props = {
  small?: boolean;
};

export default (props: Props) => {
  const context = useContext(MessageContext);
  let { message } = useMessage(context);

  let user =
    useRecoilValueLoadable(UsersState(message.user_id)).valueMaybe() ||
    (message.users || []).find(u => u.id === message.user_id);
  const companyApplications =
    useRecoilState(CompanyApplicationsStateFamily(context.companyId))[0] || [];
  let application = companyApplications.find(a => a.id === message.application_id);

  return (
    <>
      {!!user && !message.application_id && (
        <div
          className="sender-head"
          style={{
            backgroundImage: "url('" + User.getThumbnail(user) + "')",
          }}
        ></div>
      )}
      {!!message.application_id && (
        <Icon
          className="no-margin-left"
          style={{ fontSize: props.small ? '16px' : '24px' }}
          type={
            message.override?.picture || WorkspacesApps.getAppIcon(application) || 'puzzle-piece'
          }
        />
      )}
    </>
  );
};
