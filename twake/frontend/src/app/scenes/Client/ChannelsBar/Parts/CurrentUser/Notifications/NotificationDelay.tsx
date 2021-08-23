import React from 'react';
import { isEmpty } from 'lodash';
import NotificationBell from './NotificationBell';

import { Collection } from 'services/CollectionsReact/Collections';
import { NotificationPreferencesResource } from 'app/models/NotificationPreferences';

export default () => {
  const url = '/notifications/v1/preferences/';
  const notificationPreferencesCollection = Collection.get(url, NotificationPreferencesResource);
  const notificationPreferences = notificationPreferencesCollection.useWatcher({});

  return isEmpty(notificationPreferences) ? (
    <></>
  ) : (
    <NotificationBell preferences={notificationPreferences} />
  );
};
