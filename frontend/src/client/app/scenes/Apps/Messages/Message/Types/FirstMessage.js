import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import Emojione from 'components/Emojione/Emojione.js';
import User from 'services/user/user.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';

export default class FirstMessage extends Component {
  constructor(props) {
    super(props);
    this.props = props;

    this.state = {
      i18n: Languages,
      channels_repository: Collections.get('channels'),
    };

    var channel = this.state.channels_repository.find(this.props.channelId);

    Languages.addListener(this);
    Collections.get('channels').addListener(this);
    if (channel) {
      Collections.get('channels').listenOnly(this, [channel.front_id]);
    }
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Collections.get('channels').removeListener(this);
  }
  render() {
    var channel = this.state.channels_repository.find(this.props.channelId);
    var i_user = 0;

    if (channel.app_id) {
      channel.app = Collections.get('applications').find(channel.app_id) || {};
      if (!channel.app.id) {
        WorkspacesApps.getApp(channel.app_id);
      }
    }

    return (
      <div className="first_message">
        {channel.direct && channel.app_id && (
          <div className="content">
            <div className="channel_first_message_icon">
              <div
                className="user_image"
                style={{ backgroundImage: "url('" + channel.app.icon_url + "')" }}
              />
            </div>
            <div className="title">
              {((channel.app.display || {}).member_app || {}).name || channel.app.name}
            </div>
            <div className="text">
              {Languages.t(
                'scenes.apps.messages.message.types.first_message_text',
                [],
                "C'est le premier message",
              )}
            </div>
          </div>
        )}
        {channel.direct && !channel.app_id && (
          <div className="content">
            <div className="channel_first_message_icon">
              {channel.members.map(id => {
                if (id == User.getCurrentUserId() && channel.members_count > 1) {
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
            </div>
            <div className="title">
              {channel.members
                .map(id => {
                  if (id == User.getCurrentUserId() && channel.members_count > 1) {
                    return undefined;
                  }
                  i_user++;
                  var user = Collections.get('users').known_objects_by_id[id];
                  if (user) {
                    return (
                      (i_user > 1 ? ', ' : ' ') +
                      (channel.members > 2
                        ? user.firstname || user.username
                        : User.getFullName(user))
                    );
                  } else {
                    User.asyncGet(id);
                  }
                })
                .join('')}
            </div>
            <div className="text">
              {Languages.t(
                'scenes.apps.messages.message.types.first_message_text',
                [],
                "C'est le premier message",
              )}
            </div>
          </div>
        )}
        {!channel.direct && (
          <div className="content">
            <Emojione s128 type={channel.icon} />
            <div className="title">{channel.name}</div>
            <div className="text">
              {Languages.t(
                'scenes.apps.messages.message.types.first_channel_message_text',
                [channel.name],
                "C'est le premier message du canal",
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}
