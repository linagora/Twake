import React from 'react';
import moment from 'moment';

import Menu from 'components/Menus/Menu';
import Icon from 'components/Icon/Icon.js';

import Languages from 'services/languages/languages';
import NotificationPreferences from 'app/services/user/NotificationPreferences';

type PropsType = {
  preferences: any;
};

export default (props: PropsType) => {
  const status = NotificationPreferences.areNotificationsAllowed();

  const tomorrowMorning = moment().add(1, 'd').hour(9).minute(0).second(0);
  const hoursUntilTomorrowMorning = moment
    .duration(tomorrowMorning.diff(moment(new Date())))
    .asHours();

  const notifications_menu = [
    {
      type: 'menu',
      hide: true, //Disabled until refactor
      text: Languages.t('scenes.app.channelsbar.currentuser.user_parameter'),
      onClick: () => {},
    },
    {
      type: 'menu',
      text: Languages.t('scenes.app.channelsbar.currentuser.disabling_notifications'),
      onClick: () => NotificationPreferences.deactivateNotificationsUntil(1, 'h'),
    },
    {
      type: 'menu',
      text: '2 hours', // Add translation
      onClick: () => NotificationPreferences.deactivateNotificationsUntil(2, 'h'),
    },
    {
      type: 'menu',
      text: Languages.t('scenes.app.channelsbar.currentuser.disabling_notifications_until'),
      onClick: () =>
        NotificationPreferences.deactivateNotificationsUntil(hoursUntilTomorrowMorning, 'h'),
    },
    {
      type: 'menu',
      text: Languages.t(
        status
          ? 'scenes.app.channelsbar.currentuser.disable_notifications'
          : 'scenes.app.channelsbar.currentuser.reactivate_notifications',
      ),
      onClick: () => {
        status
          ? NotificationPreferences.deactivateNotificationsUntil(24, 'y')
          : NotificationPreferences.deactivateNotificationsUntil(0, 's');
      },
    },
    {
      // TODO: Calculate the real value
      hide: true,
      type: 'text',
      text: '35 minutes remaning', // Vos notifications sont désactivées jusqu'à hh:mm
      className: 'remaning-time',
    },
  ];

  return (
    <Menu menu={notifications_menu} position="bottom">
      <div className="notifications">
        <div className={`bell ${status ? '' : 'sleep'}`}>
          <Icon type={status ? 'bell' : 'bell-slash'} className="bell-icon" />
        </div>
      </div>
    </Menu>
  );
};
