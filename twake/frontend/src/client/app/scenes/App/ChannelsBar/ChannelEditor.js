import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Icon from 'components/Icon/Icon.js';
import Collections from 'services/Collections/Collections.js';
import Menu from 'components/Menus/Menu.js';
import InputWithIcon from 'components/Inputs/InputWithIcon.js';
import Switch from 'components/Inputs/Switch.js';
import MenusManager from 'services/Menus/MenusManager.js';
import ChannelsService from 'services/channels/channels.js';
import Workspaces from 'services/workspaces/workspaces.js';
import Groups from 'services/workspaces/groups.js';
import UserPicker from 'components/UserPicker/UserPicker.js';
import Button from 'components/Buttons/Button.js';
import Input from 'components/Inputs/Input.js';

export default class ChannelEditor extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
      channel: null,
      users: [],
    };

    Languages.addListener(this);
  }
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
            placeholder="Name"
            value={[this.state.channel.icon, this.state.channel.name]}
            onEnter={() => this.updateChan()}
            onChange={value => {
              this.setChannelKey({ icon: value[0], name: value[1] });
            }}
          />
        )}
        <div>
          <Switch
            label={Languages.t('scenes.app.channelsbar.private_channel_label', [], 'Chaîne privée')}
            value={this.state.channel.private}
            onChange={state => this.setChannelKey({ private: state })}
          />
        </div>
        <div className="menu-buttons">
          <Button
            disabled={this.state.channel.name.length <= 0 && !this.state.channel.app_id}
            type="submit"
            value={
              this.state.channel.id
                ? Languages.t('scenes.app.channelsbar.save_channel_button', [], 'Enregistrer')
                : Languages.t('scenes.app.channelsbar.add_channel_button', [], 'Ajouter')
            }
            onClick={() => this.updateChan()}
          />
        </div>
      </div>
    );
  }
}
