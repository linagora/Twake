import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import './MainView.scss';
import Drive from 'scenes/Apps/Drive/Drive.js';
import Globals from 'services/Globals.js';
import Api from 'services/api.js';
import GroupSwitch from 'components/Leftbar/GroupSwitch/GroupSwitch.js';

export default class MainView extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
      users_repository: Collections.get('users'),
      value: '',
      loading: false,
      group: {},
    };

    Languages.addListener(this);
    Collections.get('users').addListener(this);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Collections.get('users').removeListener(this);
  }
  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }
  componentDidMount() {
    Api.post(
      'workspace/get_public_data',
      { workspace_id: Globals.store_public_access_get_data.workspace_id },
      res => {
        if (res && res.data) {
          console.log(res.data);
          this.state.group = {
            name: res.data.group_name,
            logo: Globals.window.addApiUrlIfNeeded(res.data.group_logo),
          };
          this.setState({});
        }
      },
    );
  }
  render() {
    var noapp = (
      <div>
        <div className="no_channel_text">
          {Languages.t(
            'scenes.app.mainview.link_expired',
            [],
            'This public link is invalid or has expired.',
          )}
        </div>
      </div>
    );

    var found = false;
    var view = (Globals.store_public_access_get_data || {}).view;

    var group = this.state.group;

    return [
      <div className="public_header">
        <div className="left">
          <GroupSwitch group={group} notifications={0} imageOnly />
          <span className="companyName">{group.name}</span>
        </div>
        <div className="right">
          <a href="https://twakeapp.com" target="_BLANK">
            <span className="nomobile">
              {Languages.t(
                'scenes.app.mainview.create_account',
                [],
                'Créez votre espace de travail gratuitement sur ',
              )}
            </span>
            Twake &nbsp; 👉
          </a>
        </div>
      </div>,
      <div className="main_view public">
        {!this.state.loading && view == 'drive_public_access' && (found = true) && (
          <Drive key={'public_drive'} />
        )}
        {!found && !this.state.loading && noapp}
      </div>,
    ];
  }
}
