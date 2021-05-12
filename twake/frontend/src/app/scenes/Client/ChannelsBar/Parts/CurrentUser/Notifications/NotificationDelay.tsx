import React from 'react';
import _ from 'lodash';

import NotificationParametersService from 'services/user/notificationParameters';
import NotificationBell from './NotificationBell';

import { Collection } from 'services/CollectionsReact/Collections';
import { NotificationPreferencesResource } from 'app/models/NotificationPreferences';

export default () => {
  // const preferences = NotificationParametersService.useWatcher(
  //   () => NotificationParametersService.notificationPreferences,
  // );

  const url = '/notifications/v1/preferences/';
  const notificationPreferencesCollection = Collection.get(url, NotificationPreferencesResource);
  const notificationPreferences = notificationPreferencesCollection.useWatcher({});

  return _.isEmpty(notificationPreferences) ? (
    <></>
  ) : (
    <NotificationBell preferences={notificationPreferences} />
  );
};
