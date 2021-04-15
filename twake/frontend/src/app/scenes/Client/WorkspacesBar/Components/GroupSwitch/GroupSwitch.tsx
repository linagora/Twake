import { NotificationResource } from 'app/models/Notification';
import { Collection } from 'app/services/CollectionsReact/Collections';
import Notifications from 'services/user/notifications';
import React, { Component } from 'react';

import './GroupSwitch.scss';

export default (props: {
  group: any;
  imageOnly: boolean;
  selected: boolean;
  onClick: () => {};
  refDiv: any;
  refLogo: any;
}) => {
  var group = props.group || {};

  const notificationsCollection = Collection.get('/notifications/v1/badges/', NotificationResource);
  const unreadOtherCompanies = notificationsCollection
    .useWatcher({})
    .filter(e => e.data.company_id !== group.id).length;

  return (
    <div
      ref={props.refDiv}
      className={'group_switch ' + (props.imageOnly ? 'image_only' : '')}
      onClick={props.onClick}
    >
      <div
        ref={props.refLogo}
        className={'current_company_logo ' + (group.logo ? 'has_image ' : '')}
        style={{ backgroundImage: "url('" + (window as any).addApiUrlIfNeeded(group.logo) + "')" }}
      >
        {((group.mininame || group.name || '') + '-')[0].toUpperCase()}
        {unreadOtherCompanies > 0 && <div className="notification_dot" />}
      </div>
      <div className="company_name">{(group.name || '').trim()}</div>
    </div>
  );
};
