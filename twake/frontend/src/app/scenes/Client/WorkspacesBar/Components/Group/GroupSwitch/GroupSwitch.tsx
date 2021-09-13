// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';

import { NotificationResource } from 'app/models/Notification';
import { CompanyType } from 'app/models/Company';
import { Collection } from 'app/services/CollectionsReact/Collections';
import { addApiUrlIfNeeded } from 'app/services/utils/URLUtils';

import './GroupSwitch.scss';

export default (props: {
  group: CompanyType;
  imageOnly: boolean;
  selected: boolean;
  onClick: () => {};
  refDiv: any;
  refLogo: any;
}) => {
  const group = props.group || {};
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
        style={{ backgroundImage: addApiUrlIfNeeded(group.logo, true) }}
      >
        {((group.mininame || group.name || '') + '-')[0].toUpperCase()}
        {unreadOtherCompanies > 0 && <div className="notification_dot" />}
      </div>
      <div className="company_name">{(group.name || '').trim()}</div>
    </div>
  );
};
