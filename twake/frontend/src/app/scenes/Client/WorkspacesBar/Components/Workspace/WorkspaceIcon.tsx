// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import classNames from 'classnames';

import { NotificationResource } from 'app/models/Notification';
import { Collection } from 'app/services/CollectionsReact/Collections';
import { addApiUrlIfNeeded } from 'app/services/utils/URLUtils';
import { WorkspaceType } from 'app/models/Workspace';

type Props = {
  workspace: WorkspaceType;
  selected: boolean;
  onClick: () => void;
}

export default (props: Props): JSX.Element => {
  const notificationsCollection = Collection.get('/notifications/v1/badges/', NotificationResource);
  const unreadInWorkspace = notificationsCollection.useWatcher({ workspace_id: props.workspace.id }).length;
  const workspace = props.workspace || {};
  const name = workspace.mininame || workspace.name || '';

  return (
    <div
      className={
        classNames('workspace', {
          'is_selected': props.selected,
          'has_notifications': unreadInWorkspace > 0,
        })
      }
      onClick={props.onClick}
    >
      <div
        className={
          classNames('image', {
            'has_image': !!workspace.logo,
          })
        }
        style={{ backgroundImage: addApiUrlIfNeeded(workspace.logo, true) }}
      >
        {`${name}-`[0].toUpperCase()}
        {unreadInWorkspace > 0 && <div className="notification_dot" />}
      </div>
      <div className="name">{name}</div>
    </div>
  );
};
