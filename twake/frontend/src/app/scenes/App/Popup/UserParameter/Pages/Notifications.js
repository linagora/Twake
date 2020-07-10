<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

import Languages from 'services/languages/languages.js';
import currentUserService from 'services/user/current_user.js';
import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout.js';
import Attribute from 'components/Parameters/Attribute.js';
import NotificationParameters from 'services/user/notification_parameters.js';
import Switch from 'components/Inputs/Switch.js';
import Radio from 'components/Inputs/Radio.js';
import AutoHeight from 'components/AutoHeight/AutoHeight.js';

export default class Notifications extends Component {
  constructor() {
    super();
    this.state = {
      i18n: Languages,
      notifications_parameters: NotificationParameters,
    };
    Languages.addListener(this);
    NotificationParameters.addListener(this);
    NotificationParameters.init();
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    NotificationParameters.removeListener(this);
  }
  render() {
    return (
      <div className={this.state.notifications_parameters.loading ? 'loading ' : ''}>
        <div className="title">{this.state.i18n.t('scenes.apps.account.notifications.title')}</div>

        <div className="group_section">
          <div className="subtitle">
            {Languages.t(
              'scenes.app.popup.userparameter.pages.frequency_notif_subtitle',
              [],
<<<<<<< HEAD
              'Fréquence des notifications'
=======
              'Fréquence des notifications',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          </div>

          <Attribute
            label={this.state.i18n.t('scenes.apps.account.notifications.keywords_subtitle')}
            description={Languages.t(
              'scenes.app.popup.userparameter.pages.keywords_notif_description',
              [],
<<<<<<< HEAD
              'Ne recevez que des notifications correspondant à certains mots clés.'
=======
              'Ne recevez que des notifications correspondant à certains mots clés.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
              <Switch
                label={this.state.i18n.t('scenes.apps.account.notifications.keywords_option')}
                value={this.state.notifications_parameters.preferences.dont_use_keywords == 1}
                onChange={checked => {
                  NotificationParameters.preferences.dont_use_keywords = checked ? 1 : 0;
                  NotificationParameters.notify();
                }}
              />

              {!this.state.notifications_parameters.preferences.dont_use_keywords ? (
                <span>
                  <div className="text bottom-margin">
                    {this.state.i18n.t(
                      'scenes.apps.account.notifications.keywords_activated_text',
<<<<<<< HEAD
                      currentUserService.get().username
=======
                      currentUserService.get().username,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                    )}
                  </div>
                  <AutoHeight
                    value={NotificationParameters.preferences.keywords}
                    placeholder={this.state.i18n.t(
<<<<<<< HEAD
                      'scenes.apps.account.notifications.keywords_placeholder'
=======
                      'scenes.apps.account.notifications.keywords_placeholder',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                    )}
                    className="bottom-margin"
                    onChange={evt => {
                      NotificationParameters.preferences.keywords = evt.target.value;
                      NotificationParameters.notify();
                    }}
                  >
                    {this.state.notifications_parameters.preferences.keywords}
                  </AutoHeight>
                </span>
              ) : (
                <span />
              )}

              <ButtonWithTimeout
                className="small buttonValidation"
                disabled={this.state.notifications_parameters.loading}
                onClick={() => NotificationParameters.save(['keywords', 'dont_use_keywords'])}
                value={this.state.i18n.t('general.update')}
              />
            </div>
          </Attribute>

          <Attribute
            label={Languages.t(
              'scenes.app.popup.userparameter.pages.no_night_disturbing_label',
              [],
<<<<<<< HEAD
              'Ne pas déranger la nuit'
=======
              'Ne pas déranger la nuit',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
            description={Languages.t(
              'scenes.app.popup.userparameter.pages.no_disturbing_notif_period_description',
              [],
<<<<<<< HEAD
              'Choisissez une période pendant laquelle vous ne recevez pas de notifications.'
=======
              'Choisissez une période pendant laquelle vous ne recevez pas de notifications.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
              <div className="text">
                {this.state.i18n.t('scenes.apps.account.notifications.disturb_option_a')}
                <select
                  id="after"
                  className="select_inline"
                  style={{ width: '80px', display: 'inline-block', margin: '0 10px' }}
                  value={
                    NotificationParameters.transform_period(
                      this.state.notifications_parameters.preferences.dont_disturb_between,
                      this.state.notifications_parameters.preferences.dont_disturb_and,
<<<<<<< HEAD
                      -new Date().getTimezoneOffset() / 60
=======
                      -new Date().getTimezoneOffset() / 60,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                    )[0]
                  }
                  onChange={evt => {
                    NotificationParameters.preferences.dont_disturb_between = NotificationParameters.transform_period(
                      evt.target.value,
                      this.state.notifications_parameters.preferences.dont_disturb_and,
<<<<<<< HEAD
                      new Date().getTimezoneOffset() / 60
=======
                      new Date().getTimezoneOffset() / 60,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                    )[0];
                    NotificationParameters.notify();
                  }}
                >
                  {(() => {
                    var options = [];
                    for (var i = 0; i < 24; i += 0.5) {
                      var value = i;
                      var text = parseInt(i) + ':' + ((i * 2) % 2 == 0 ? '00' : '30');
                      options.push(<option value={value}>{text}</option>);
                    }
                    return options;
                  })()}
                </select>
                {this.state.i18n.t('scenes.apps.account.notifications.disturb_option_b')}
                <select
                  id="before"
                  className="select_inline"
                  style={{ width: '80px', display: 'inline-block', margin: '0 10px' }}
                  value={
                    NotificationParameters.transform_period(
                      this.state.notifications_parameters.preferences.dont_disturb_between,
                      this.state.notifications_parameters.preferences.dont_disturb_and,
<<<<<<< HEAD
                      -new Date().getTimezoneOffset() / 60
=======
                      -new Date().getTimezoneOffset() / 60,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                    )[1]
                  }
                  onChange={evt => {
                    NotificationParameters.preferences.dont_disturb_and = NotificationParameters.transform_period(
                      this.state.notifications_parameters.preferences.dont_disturb_between,
                      evt.target.value,
<<<<<<< HEAD
                      new Date().getTimezoneOffset() / 60
=======
                      new Date().getTimezoneOffset() / 60,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                    )[1];
                    NotificationParameters.notify();
                  }}
                >
                  {(() => {
                    var options = [];
                    for (var i = 0; i < 24; i += 0.5) {
                      var value = i;
                      var text = parseInt(i) + ':' + ((i * 2) % 2 == 0 ? '00' : '30');
                      options.push(<option value={value}>{text}</option>);
                    }
                    return options;
                  })()}
                </select>
                {this.state.i18n.t('scenes.apps.account.notifications.disturb_option_c')}
              </div>

              <ButtonWithTimeout
                className="small buttonValidation"
                disabled={this.state.notifications_parameters.loading}
                onClick={() =>
                  NotificationParameters.save(['dont_disturb_and', 'dont_disturb_between'])
                }
                value={this.state.i18n.t('general.update')}
              />
            </div>
          </Attribute>

          <Attribute
            label={this.state.i18n.t('scenes.apps.account.notifications.devices_subtitle')}
            description={Languages.t(
              'scenes.app.popup.userparameter.pages.frequency_notif_configuration_description',
              [],
<<<<<<< HEAD
              'Configurez la fréquence des notifications mobile.'
=======
              'Configurez la fréquence des notifications mobile.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
              <Radio
                small
                label={this.state.i18n.t('scenes.apps.account.notifications.devices_option_ever')}
                value={this.state.notifications_parameters.preferences.devices == 0}
                onChange={checked => {
                  NotificationParameters.preferences.devices = 0;
                  NotificationParameters.notify();
                }}
              />
              <br />

              <Radio
                small
                label={this.state.i18n.t(
<<<<<<< HEAD
                  'scenes.apps.account.notifications.devices_option_inactive'
=======
                  'scenes.apps.account.notifications.devices_option_inactive',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                )}
                value={this.state.notifications_parameters.preferences.devices == 1}
                onChange={checked => {
                  NotificationParameters.preferences.devices = 1;
                  NotificationParameters.notify();
                }}
              />
              <br />

              <Radio
                small
                label={this.state.i18n.t('scenes.apps.account.notifications.devices_option_never')}
                value={this.state.notifications_parameters.preferences.devices == 3}
                onChange={checked => {
                  NotificationParameters.preferences.devices = 3;
                  NotificationParameters.notify();
                }}
              />

              <ButtonWithTimeout
                className="small buttonValidation"
                disabled={this.state.notifications_parameters.loading}
                onClick={() => NotificationParameters.save(['devices'])}
                value={this.state.i18n.t('general.update')}
              />
            </div>
          </Attribute>

          <Attribute
            label={this.state.i18n.t('scenes.apps.account.notifications.mail_subtitle')}
            description={Languages.t(
              'scenes.app.popup.userparameter.pages.mail_frequency_notif_configuration_description',
              [],
<<<<<<< HEAD
              'Configurez la fréquence des notifications mail.'
=======
              'Configurez la fréquence des notifications mail.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
              <Radio
                small
                label={this.state.i18n.t('scenes.apps.account.notifications.mail_option_ever')}
                value={this.state.notifications_parameters.preferences.mail_notifications == 2}
                onChange={checked => {
                  NotificationParameters.preferences.mail_notifications = 2;
                  NotificationParameters.notify();
                }}
              />
              <br />

              <Radio
                small
                label={this.state.i18n.t('scenes.apps.account.notifications.mail_option_daily')}
                value={this.state.notifications_parameters.preferences.mail_notifications == 1}
                onChange={checked => {
                  NotificationParameters.preferences.mail_notifications = 1;
                  NotificationParameters.notify();
                }}
              />
              <br />

              <Radio
                small
                label={this.state.i18n.t('scenes.apps.account.notifications.mail_option_never')}
                value={this.state.notifications_parameters.preferences.mail_notifications == 0}
                onChange={checked => {
                  NotificationParameters.preferences.mail_notifications = 0;
                  NotificationParameters.notify();
                }}
              />

              <ButtonWithTimeout
                className="small buttonValidation"
                disabled={this.state.notifications_parameters.loading}
                onClick={() => NotificationParameters.save(['mail_notifications'])}
                value={this.state.i18n.t('general.update')}
              />
            </div>
          </Attribute>
        </div>

        <div className="group_section">
          <div className="subtitle">
            {this.state.i18n.t('scenes.apps.account.notifications.privacy_subtitle')}
          </div>

          <Attribute
            label={Languages.t(
              'scenes.app.popup.userparameter.pages.notif_content_label',
              [],
<<<<<<< HEAD
              'Contenu des notifications'
=======
              'Contenu des notifications',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
            description={Languages.t(
              'scenes.app.popup.userparameter.pages.notif_content_description',
              [],
<<<<<<< HEAD
              'Masquer le contenu des notifications mobile.'
=======
              'Masquer le contenu des notifications mobile.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
              <Switch
                label={this.state.i18n.t('scenes.apps.account.notifications.privacy_option')}
                value={this.state.notifications_parameters.preferences.privacy == 1}
                onChange={checked => {
                  NotificationParameters.preferences.privacy = checked ? 1 : 0;
                  NotificationParameters.notify();
                }}
              />
              <ButtonWithTimeout
                className="small buttonValidation"
                disabled={this.state.notifications_parameters.loading}
                onClick={() => NotificationParameters.save(['privacy'])}
                value={this.state.i18n.t('general.update')}
              />
            </div>
          </Attribute>
        </div>
      </div>
    );
  }
}
