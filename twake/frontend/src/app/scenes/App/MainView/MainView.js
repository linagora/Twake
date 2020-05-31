import React, {Component} from 'react';

import Languages from 'services/languages/languages.js';
import ChannelsService from 'services/channels/channels.js';
import Collections from 'services/Collections/Collections.js';
import Icon from 'components/Icon/Icon.js';
import Emojione from 'components/Emojione/Emojione.js';
import User from 'services/user/user.js';
import './MainView.scss';
import PlugIcon from '@material-ui/icons/PowerOutlined';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import Tabs from './Tabs/Tabs.js';
import Messages from 'scenes/Apps/Messages/Messages.js';
import Drive from 'scenes/Apps/Drive/Drive.js';
import Calendar from 'scenes/Apps/Calendar/Calendar.js';
import Tasks from 'scenes/Apps/Tasks/Tasks.js';
import Search from './Search.js';

export default class MainView extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
      channels: ChannelsService,
      channels_repository: Collections.get('channels'),
      users_repository: Collections.get('users'),
      value: '',
      loading: true,
    };

    Languages.addListener(this);
    ChannelsService.addListener(this);
    Collections.get('channels').addListener(this);
    Collections.get('users').addListener(this);

    this.shouldComponentUpdate({}, this.state);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    ChannelsService.removeListener(this);
    Collections.get('channels').removeListener(this);
    Collections.get('users').removeListener(this);
  }
  shouldComponentUpdate(nextProps, nextState) {
    var key = this.state.channels.currentChannelFrontId + '_' + this.state.channels.current_tab_id;
    if (key != this.old_key) {
      this.old_key = key;
      nextState.loading = true;
      setTimeout(() => {
        this.setState({ loading: false });
      }, 100);
    }
    return true;
  }
  render() {
    var current_channel = Collections.get('channels').findByFrontId(
      this.state.channels.currentChannelFrontId,
    );
    var current_channel_tab = Collections.get('channel_tabs').find(
      this.state.channels.current_tab_id,
    );

    if (this.state.channels.current_tab_id) {
      current_channel.tabs.every(item => {
        if (
          item.id == this.state.channels.current_tab_id &&
          JSON.stringify(current_channel_tab) != JSON.stringify(item)
        ) {
          Collections.get('channel_tabs').completeObject(item);
          current_channel_tab = Collections.get('channel_tabs').find(
            this.state.channels.current_tab_id,
          );
          return false;
        }
        return true;
      });
    }
    var i_user = 0;

    var noapp = (
      <div>
        <div className="no_channel_text">
          {Languages.t(
            'scenes.app.mainview.instruction_current_tab',
            [],
            'Commencez par sélectionner une chaîne sur votre gauche.',
          )}
        </div>
      </div>
    );

    if (
      !current_channel ||
      (!current_channel.direct &&
        Object.values(current_channel.members || [])
          .concat(Object.values(current_channel.ext_members || []))
          .indexOf(User.getCurrentUserId()) < 0)
    ) {
      return <div className="main_view">{noapp}</div>;
    }

    if (current_channel.app_id) {
      current_channel.app = Collections.get('applications').find(current_channel.app_id) || {};
      if (!current_channel.app.id) {
        WorkspacesApps.getApp(current_channel.app_id);
        return <div className="main_view">{noapp}</div>;
      }
    }

    var app = 'messages';
    if ((current_channel.app || {}).simple_name && !current_channel.direct) {
      app = current_channel.app;
    } else if (current_channel_tab) {
      app = Collections.get('applications').find(current_channel_tab.app_id);
    }

    if (current_channel.direct) {
      var members_front_ids = [];
      Object.values(current_channel.members).map(id => {
        var user = Collections.get('users').known_objects_by_id[id];
        if (user) {
          members_front_ids.push(user.front_id);
        }
      });
      Collections.get('users').listenOnly(this, members_front_ids);
    } else {
      Collections.get('users').listenOnly(this, [
        Collections.get('users').find(User.getCurrentUserId()).front_id,
      ]);
    }

    var found = false;

    var icon = 'comments-alt';
    var emoji = '';
    if (app && app.name) {
      icon = WorkspacesApps.getAppIcon(app);
      emoji = '';
      if ((icon || '').indexOf('http') === 0) {
        emoji = icon;
        icon = '';
      }
    }

    return (
      <div className="main_view">
        <div className="header">
          {!!current_channel.application && (
            <div className="channel_header">
              <div className="title">
                <div className="app-icon">
                  {!!icon && <Icon className="tab-app-icon" type={icon} />}
                  {!!emoji && <Emojione className="tab-app-icon" type={emoji} />}
                </div>
                {app.name}
                {!!current_channel.private && <Icon className="lock_icon" type="lock" />}
              </div>
            </div>
          )}
          {!current_channel.application && !current_channel.direct && (
            <div className="channel_header">
              <div className="title">
                <Emojione type={current_channel.icon} /> {current_channel.name}
                {!!current_channel.private && <Icon className="lock_icon" type="lock" />}
              </div>
            </div>
          )}
          {!current_channel.application && !!current_channel.direct && !!current_channel.app_id && (
            <div className="channel_header">
              <div className="title direct_message">
                <PlugIcon className="m-icon-small app-plug-icon" />
                <div
                  className="user_image"
                  style={{ backgroundImage: "url('" + current_channel.app.icon_url + "')" }}
                />
                {' ' +
                  (((current_channel.app.display || {}).member_app || {}).name ||
                    current_channel.app.name)}
              </div>
            </div>
          )}
          {!current_channel.application && !!current_channel.direct && !current_channel.app_id && (
            <div className="channel_header">
              <div className="title direct_message">
                {Object.values(current_channel.members).map(id => {
                  if (id == User.getCurrentUserId() && current_channel.members_count > 1) {
                    return undefined;
                  }
                  var user = Collections.get('users').known_objects_by_id[id];
                  if (user) {
                    return (
                      <div
                        key={'user_' + id}
                        className="user_image"
                        style={{ backgroundImage: "url('" + User.getThumbnail(user) + "')" }}
                      />
                    );
                  } else {
                    User.asyncGet(id);
                  }
                })}

                {current_channel.members_count > 2 &&
                  ' (' + (current_channel.members_count - 1) + ')'}

                {Object.values(current_channel.members)
                  .map(id => {
                    if (id == User.getCurrentUserId() && current_channel.members_count > 1) {
                      return undefined;
                    }
                    i_user++;
                    var user = Collections.get('users').known_objects_by_id[id];
                    if (user) {
                      return (
                        (i_user > 1 ? ', ' : ' ') +
                        (Object.values(current_channel.members).length > 2
                          ? user.firstname || user.username
                          : User.getFullName(user))
                      );
                    } else {
                      User.asyncGet(id);
                    }
                  })
                  .join('')}
              </div>
            </div>
          )}

          <Tabs channel={current_channel} currentTab={this.state.channels.current_tab_id} />

          <div className="right">
            <Search />
          </div>
        </div>

        {!this.state.loading && (app || {}).simple_name == 'twake_drive' && (found = true) && (
          <Drive
            key={current_channel.id + '_' + (current_channel_tab || {}).id}
            channel={current_channel}
            tab={current_channel_tab}
          />
        )}
        {!this.state.loading && (app || {}).simple_name == 'twake_calendar' && (found = true) && (
          <Calendar
            key={current_channel.id + '_' + (current_channel_tab || {}).id}
            channel={current_channel}
            tab={current_channel_tab}
          />
        )}
        {!this.state.loading && (app || {}).simple_name == 'twake_tasks' && (found = true) && (
          <Tasks
            key={current_channel.id + '_' + (current_channel_tab || {}).id}
            channel={current_channel}
            tab={current_channel_tab}
          />
        )}
        {!this.state.loading && app == 'messages' && (found = true) && (
          <Messages key={current_channel.id} channel={current_channel} />
        )}
        {!found && !this.state.loading && noapp}
      </div>
    );
  }
}
