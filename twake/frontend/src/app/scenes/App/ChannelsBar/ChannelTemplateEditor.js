import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import InputWithIcon from 'components/Inputs/InputWithIcon.js';
import Workspaces from 'services/workspaces/workspaces.js';
import Groups from 'services/workspaces/groups.js';
import Button from 'components/Buttons/Button.js';
import UserListManager from 'components/UserListManager/UserListManager.js';
import {
  ObjectModalSeparator,
  ObjectModalSectionTitle,
} from 'components/ObjectModal/ObjectModal.js';

export default class ChannelTemplateEditor extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
      channel: null,
      users: [],
    };

    Languages.addListener(this);
  }
  newChannel = () => {
    this.props.newChannel(this.state.channel);
  };
  componentWillMount() {
    if (!this.props.channel || !this.props.channel.id) {
      this.state.channel = Collections.get('channels').editCopy(this.props.channel);
      this.state.channel.original_workspace = Workspaces.currentWorkspaceId;
      this.state.channel.original_group = Groups.currentGroupId;
    } else {
      this.state.channel = Collections.get('channels').edit(this.props.channel);
    }

    this.state.channel.name = this.state.channel.name || '';
    this.state.channel.icon = this.state.channel.icon || '';
    this.state.channel.private =
      this.state.channel.private === undefined ? true : this.state.channel.private;
  }
  componentWillUnmount() {
    if (this.state.channel && !this.saved) {
      Collections.get('channels').cancelEdit(this.state.channel);
    }
    Languages.removeListener(this);
  }
  updateChan() {
    this.saved = true;
    Collections.get('channels').save(
      this.state.channel,
      'channels_' + Workspaces.currentWorkspaceId,
    );
    MenusManager.closeMenu();
  }
  setChannelKey(key_value) {
    Object.keys(key_value).forEach(key => {
      this.state.channel[key] = key_value[key];
    });
    this.setState({});
  }
  render() {
    return (
      <div>
        {!this.state.channel.app_id && (
          <InputWithIcon
            focusOnDidMount
            menu_level={this.props.level}
            placeholder={Languages.t(
              'scenes.apps.messages.left_bar.stream_modal.placeholder_name',
              'Name',
            )}
            value={[this.state.channel.icon, this.state.channel.name]}
            onEnter={() => this.updateChan()}
            onChange={value => {
              this.setChannelKey({ icon: value[0], name: value[1] });
              this.newChannel();
            }}
          />
        )}
        <div>
          <ObjectModalSeparator />
          <ObjectModalSectionTitle
            title={Languages.t(
              'scenes.apps.calendar.event_edition.title_participants',
              'Participants',
            )}
            action={
              <Button
                className="button small primary-text"
                onClick={() => {
                  this.setChannelKey({ private: !this.state.channel.private });
                  this.newChannel();
                }}
              >
                {Languages.t(
                  this.state.channel.private
                    ? 'scenes.app.channelsbar.public_channel_label'
                    : 'scenes.app.channelsbar.private_channel_label',
                )}
              </Button>
            }
          />
          {(this.state.channel.private && (
            <UserListManager
              users={this.state.channel.members ? this.state.channel.members : []}
              onUpdate={ids => {
                this.setChannelKey({ members: ids });
                this.newChannel();
              }}
              canRemoveMyself
              noPlaceholder
              scope="group"
            />
          )) || (
            <div
              className="text secondary-text top-margin small-bottom-margin"
              style={{ minHeight: '32px' }}
            >
              {Languages.t(
                'scenes.app.channelsbar.private_channel_message',
                'This is a public channel, all the workspace will be invited :)',
              )}
            </div>
          )}
        </div>
        {!this.props.disableButton && (
          <div className="menu-buttons">
            <Button
              disabled={this.state.channel.name.length <= 0 && !this.state.channel.app_id}
              type="button"
              value={
                this.state.channel.id
                  ? Languages.t('scenes.app.channelsbar.save_channel_button', 'Save')
                  : Languages.t('scenes.app.channelsbar.add_channel_button', 'Add')
              }
              onClick={() => this.updateChan()}
            />
          </div>
        )}
      </div>
    );
  }
}
