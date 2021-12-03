import React, { useContext } from 'react';
import 'moment-timezone';
import User from 'services/user/UserService';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import Icon from 'components/Icon/Icon.js';
import './Threads.scss';
import UserOnlineStatus from 'app/components/OnlineUserStatus/OnlineUserStatus';
import { MessageContext } from '../Message/MessageWithReplies';
import { useMessage } from 'app/state/recoil/hooks/useMessage';
import { useCompanyApplications } from 'app/state/recoil/hooks/useCompanyApplications';
import { useUser } from 'app/state/recoil/hooks/useUser';

type Props = {
  small?: boolean;
};

export default (props: Props) => {
  const context = useContext(MessageContext);
  let { message } = useMessage(context);
  let user = useUser(message.user_id);
  let { applications: companyApplications } = useCompanyApplications(context.companyId);
  let application = companyApplications.find(a => a.id === message.application_id);

  return (
    <>
      {!!user && !message.application_id && (
        <div
          className="sender-head"
          style={{
            backgroundImage: "url('" + User.getThumbnail(user) + "')",
          }}
        >
          <UserOnlineStatus user={user} size={props.small ? 'small' : 'medium'} />
        </div>
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
