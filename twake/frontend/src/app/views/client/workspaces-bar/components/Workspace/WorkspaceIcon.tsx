// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import classNames from 'classnames';
import { Skeleton } from 'antd';

import { addApiUrlIfNeeded } from 'app/features/global/utils/URLUtils';
import { WorkspaceType } from 'app/features/workspaces/types/workspace';
import { useWorkspaceNotifications } from 'app/features/users/hooks/use-notifications';

type Props = {
  workspace: WorkspaceType;
  selected: boolean;
  onClick: () => void;
};

export default (props: Props): JSX.Element => {
  const { badges } = useWorkspaceNotifications(props.workspace.id || '');
  const unreadInWorkspace = badges.length;
  const workspace = props.workspace || {};
  const name = workspace.mininame || workspace.name || '';

  return (
    <div
      className={classNames('workspace', {
        is_selected: props.selected,
        has_notifications: unreadInWorkspace > 0,
      })}
      onClick={props.onClick}
    >
      <div
        className={classNames('image', {
          has_image: !!workspace.logo,
        })}
        style={{ backgroundImage: addApiUrlIfNeeded(workspace.logo, true) }}
      >
        {workspace.name !== '' && `${name}-`[0].toUpperCase()}
        {unreadInWorkspace > 0 && <div className="notification_dot" />}
      </div>
      <div className="name">{name}</div>
    </div>
  );
};

export const LoadingWorkspaceIcon = () => {
  const size = 32;
  const shape = 'square';
  return <Skeleton.Avatar size={size} shape={shape} style={{ marginBottom: 46 }} />;
};
