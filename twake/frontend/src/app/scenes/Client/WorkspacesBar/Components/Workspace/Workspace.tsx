import { NotificationResource } from 'app/models/Notification';
import { Collection } from 'app/services/CollectionsReact/Collections';
import React, { Component } from 'react';
import Notifications from 'services/user/notifications';

import './Workspace.scss';

export default (props: { workspace: any; selected: boolean; onClick: () => {} }) => {
  const notificationsCollection = Collection.get('/notifications/v1/badges/', NotificationResource);
  const unreadInWorkspace = notificationsCollection.useWatcher({ workspace_id: props.workspace.id })
    .length;
  const workspace = props.workspace || {};

  return (
    <div
      className={
        'workspace ' +
        (props.selected ? 'is_selected ' : '') +
        (unreadInWorkspace > 0 ? 'has_notifications ' : '')
      }
      onClick={props.onClick}
    >
      <div
        className={'image ' + (workspace.logo ? 'has_image ' : '')}
        style={{
          backgroundImage: "url('" + (window as any).addApiUrlIfNeeded(workspace.logo) + "')",
        }}
      >
        {((workspace.mininame || workspace.name || '') + '-')[0].toUpperCase()}

        {unreadInWorkspace > 0 && <div className="notification_dot" />}
      </div>
      <div className="name">{workspace.mininame || workspace.name}</div>
    </div>
  );
};
