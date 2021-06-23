import React, { useState, useRef } from 'react';
import { Input } from 'antd';
import { isEqual } from 'lodash';

import Languages from 'services/languages/languages.js';
import NotificationParameters from 'services/user/notification_parameters.js';
import { Collection } from 'services/CollectionsReact/Collections';
import NotificationPreferences from 'app/services/user/NotificationPreferences';

import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout.js';
import Attribute from 'components/Parameters/Attribute.js';
import Switch from 'components/Inputs/Switch.js';
import Radio from 'components/Inputs/Radio.js';

import {
  preferencesType,
  NotificationPreferencesResource,
} from 'app/models/NotificationPreferences';

export default () => {
  const loading = useRef(true);
  const url = '/notifications/v1/preferences/';
  const notificationPreferencesCollection = Collection.get(url, NotificationPreferencesResource);
  const notificationPreferences = notificationPreferencesCollection.useWatcher({});

  const [newPreferences, setNewPreferences] = useState<preferencesType>();

  if (loading.current && !!notificationPreferences && notificationPreferences.length) {
    setNewPreferences(notificationPreferences[0].data.preferences);
    loading.current = false;
  }

  const saveNewPreferences = async (preferences: preferencesType) => {
    const newPreferences: any = Object.entries(preferences).map(([key, value]) => ({ key, value }));

    NotificationPreferences.save(newPreferences);
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let value = 0; value < 24; value += 0.5) {
      const text = ~~value + ':' + ((value * 2) % 2 == 0 ? '00' : '30');
      options.push(
        <option key={value} value={value}>
          {text}
        </option>,
      );
    }
    return options;
  };

  if (!newPreferences) {
    return <div></div>;
  }

  return (
    <>
      <div className="title">{Languages.t('scenes.apps.account.notifications.title')}</div>
      <div className="group_section">
        <div className="subtitle">
          {Languages.t('scenes.app.popup.userparameter.pages.frequency_notif_subtitle')}
        </div>
        <Attribute
          label={Languages.t('scenes.apps.account.notifications.keywords_subtitle')}
          description={Languages.t(
            'scenes.app.popup.userparameter.pages.keywords_notif_description',
          )}
        >
          <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
            <Input
              value={newPreferences.highlight_words.join(', ')}
              placeholder={Languages.t('scenes.apps.account.notifications.keywords_placeholder')}
              className="bottom-margin"
              size="large"
              onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                setNewPreferences({
                  ...newPreferences,
                  highlight_words: evt.target.value.split(', '),
                });
              }}
            ></Input>
          </div>
        </Attribute>
        <Attribute
          label={Languages.t('scenes.app.popup.userparameter.pages.no_night_disturbing_label')}
          description={Languages.t(
            'scenes.app.popup.userparameter.pages.no_disturbing_notif_period_description',
          )}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Switch
              // TODO: Change the title and add the traduction
              label={'Enable night feature'}
              value={newPreferences.night_break.enable}
              onChange={(checked: boolean) => {
                setNewPreferences({
                  ...newPreferences,
                  night_break: {
                    ...newPreferences.night_break,
                    enable: checked,
                  },
                });
              }}
            />
            <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
              <div className="text">
                {Languages.t('scenes.apps.account.notifications.disturb_option_a')}
                <select
                  id="after"
                  className="select_inline"
                  style={{ width: '80px', display: 'inline-block', margin: '0 10px' }}
                  value={
                    NotificationParameters.transform_period(
                      newPreferences.night_break.from,
                      newPreferences.night_break.to,
                      -new Date().getTimezoneOffset() / 60,
                    )[0]
                  }
                  onChange={(evt: any) => {
                    setNewPreferences({
                      ...newPreferences,
                      night_break: {
                        ...newPreferences.night_break,
                        from: NotificationParameters.transform_period(
                          evt.target.value,
                          newPreferences.night_break.to,
                          new Date().getTimezoneOffset() / 60,
                        )[0],
                      },
                    });
                  }}
                >
                  {generateTimeOptions()}
                </select>
                {Languages.t('scenes.apps.account.notifications.disturb_option_b')}
                <select
                  id="before"
                  className="select_inline"
                  style={{ width: '80px', display: 'inline-block', margin: '0 10px' }}
                  value={
                    NotificationParameters.transform_period(
                      newPreferences.night_break.from,
                      newPreferences.night_break.to,
                      -new Date().getTimezoneOffset() / 60,
                    )[1]
                  }
                  onChange={(evt: any) => {
                    setNewPreferences({
                      ...newPreferences,
                      night_break: {
                        ...newPreferences.night_break,
                        to: NotificationParameters.transform_period(
                          newPreferences.night_break.from,
                          evt.target.value,
                          new Date().getTimezoneOffset() / 60,
                        )[1],
                      },
                    });
                  }}
                >
                  {generateTimeOptions()}
                </select>
                {Languages.t('scenes.apps.account.notifications.disturb_option_c')}
              </div>
            </div>
          </div>
        </Attribute>
        <Attribute
          label={Languages.t('scenes.apps.account.notifications.devices_subtitle')}
          description={Languages.t(
            'scenes.app.popup.userparameter.pages.frequency_notif_configuration_description',
          )}
        >
          <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
            <Radio
              small
              label={Languages.t('scenes.apps.account.notifications.devices_option_ever')}
              value={newPreferences.mobile_notifications == 'always'}
              onChange={() => {
                setNewPreferences({
                  ...newPreferences,
                  mobile_notifications: 'always',
                });
              }}
            />
            <br />

            <Radio
              small
              label={Languages.t('scenes.apps.account.notifications.devices_option_inactive')}
              value={newPreferences.mobile_notifications == 'when_inactive'}
              onChange={() => {
                setNewPreferences({
                  ...newPreferences,
                  mobile_notifications: 'when_inactive',
                });
              }}
            />
            <br />

            <Radio
              small
              label={Languages.t('scenes.apps.account.notifications.devices_option_never')}
              value={newPreferences.mobile_notifications == 'never'}
              onChange={() => {
                setNewPreferences({
                  ...newPreferences,
                  mobile_notifications: 'never',
                });
              }}
            />
          </div>
        </Attribute>
        <Attribute
          label={Languages.t('scenes.apps.account.notifications.mail_subtitle')}
          description={Languages.t(
            'scenes.app.popup.userparameter.pages.mail_frequency_notif_configuration_description',
          )}
        >
          <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
            {/* TODO: Add an explanatory message */}
            <input
              style={{
                width: '80px',
                height: '40px',
                padding: '0 10px',
                opacity: 0.8,
                borderRadius: '3px',
                border: 'solid 1px rgba(0, 0, 0, 0.3)',
              }}
              type="number"
              value={newPreferences.email_notifications_delay}
              onChange={(evt: any) => {
                setNewPreferences({
                  ...newPreferences,
                  email_notifications_delay: evt.target.value,
                });
              }}
            />
          </div>
        </Attribute>
        {/* TODO: Add DE and RU traduction and implement the feature */}
        <Attribute
          label={Languages.t('scenes.apps.account.notifications.sound')}
          description={Languages.t('scenes.apps.account.notifications.sound')}
        ></Attribute>
      </div>
      <div className="group_section">
        <div className="subtitle">
          {Languages.t('scenes.apps.account.notifications.privacy_subtitle')}
        </div>
        <Attribute
          label={Languages.t('scenes.app.popup.userparameter.pages.notif_content_label')}
          description={Languages.t(
            'scenes.app.popup.userparameter.pages.private_message_content.show',
          )}
        >
          <Switch
            label={Languages.t(
              // TODO: Add DE and RU translation
              newPreferences.private_message_content
                ? 'scenes.app.popup.userparameter.pages.private_message_content.hide'
                : 'scenes.app.popup.userparameter.pages.private_message_content.show',
            )}
            value={newPreferences.private_message_content}
            onChange={(checked: boolean) => {
              setNewPreferences({
                ...newPreferences,
                private_message_content: checked,
              });
            }}
          />
        </Attribute>
      </div>
      <div style={{ textAlign: 'right' }}>
        <ButtonWithTimeout
          className="small buttonValidation"
          disabled={isEqual(newPreferences, notificationPreferences[0].data.preferences)}
          onClick={() => saveNewPreferences(newPreferences)}
          value={Languages.t('general.update')}
        />
      </div>
    </>
  );
};
