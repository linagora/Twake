import { NotificationResource } from 'app/models/Notification';
import { Collection } from 'app/services/CollectionsReact/Collections';
import React, { Component } from 'react';

import './Workspace.scss';

export default (props: { workspace: any; selected: boolean; onClick: () => {} }) => {
  const notificationsCollection = Collection.get('/notifications/v1/badges', NotificationResource, {
    queryParameters: { company_id: props.workspace.group.id },
  });
  const notifications = notificationsCollection.useWatcher({ workspace_id: props.workspace.id });

  var workspace = props.workspace || {};
  return (
    <div
      className={
        'workspace ' +
        (props.selected ? 'is_selected ' : '') +
        (notifications.length > 0 ? 'has_notifications ' : '')
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

        {notifications.length > 0 && <div className="notification_dot" />}
      </div>
      <div className="name">{workspace.mininame || workspace.name}</div>
    </div>
  );
};
