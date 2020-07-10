<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

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
    console.log('should update');
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
          console.log('set state with ', this.state.group);
        }
<<<<<<< HEAD
      }
=======
      },
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
    );
  }
  render() {
    console.log('render');

    var noapp = (
      <div>
<<<<<<< HEAD
        <div className="no_channel_text">
          {Languages.t(
            'scenes.app.mainview.link_expired',
            [],
            'This public link is invalid or has expired.'
          )}
        </div>
=======
        <div className="no_channel_text">{Languages.t('scenes.app.mainview.link_expired', 
        [],"This public link is invalid or has expired.")}</div>
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      </div>
    );

    var found = false;
    var view = (Globals.store_public_access_get_data || {}).view;

    var group = this.state.group;
    console.log(this.state.group);

    return [
      <div className="public_header">
        <div className="left">
          <GroupSwitch group={group} notifications={0} imageOnly />
          <span className="companyName">{group.name}</span>
        </div>
        <div className="right">
          <a href="https://twakeapp.com" target="_BLANK">
<<<<<<< HEAD
            <span className="nomobile">
              {Languages.t(
                'scenes.app.mainview.create_account',
                [],
                'Créez votre espace de travail gratuitement sur '
              )}
            </span>
=======
            <span className="nomobile">{Languages.t('scenes.app.mainview.create_account', [],"Créez votre espace de travail gratuitement sur ")}</span>
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
