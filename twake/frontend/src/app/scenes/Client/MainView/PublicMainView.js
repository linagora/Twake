import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import Drive from 'scenes/Apps/Drive/Drive.js';
import Globals from 'services/Globals';
import Api from 'services/Api';
import GroupSwitch from 'app/scenes/Client/WorkspacesBar/Components/GroupSwitch/GroupSwitch';
import RouterService from 'services/RouterService';
import MenusBodyLayer from 'components/Menus/MenusBodyLayer.js';
import Viewer from 'scenes/Apps/Drive/Viewer/Viewer.js';
import './MainView.scss';

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
  routeState = RouterService.getStateFromRoute();
  componentDidMount() {
    Api.post('workspace/get_public_data', { workspace_id: this.routeState.workspaceId }, res => {
      if (res && res.data) {
        this.state.group = {
          name: res.data.group_name,
          logo: Globals.window.addApiUrlIfNeeded(res.data.group_logo),
        };
        this.setState({});
      }
    });
  }
  render() {
    const options = {
      public_access_token: this.routeState.token,
      workspace_id: this.routeState.workspaceId,
      element_id: this.routeState.documentId,
    };
    const noapp = (
      <div>
        <div className="no-channel-text">
          {Languages.t(
            'scenes.app.mainview.link_expired',
            [],
            'This public link is invalid or has expired.',
          )}
        </div>
      </div>
    );
    const group = this.state.group;

    return [
      <div className="public_header">
        <div className="left">
          <div className={'group_switch image_only'}>
            <div
              className={'current_company_logo ' + (group.logo ? 'has_image ' : '')}
              style={{ backgroundImage: "url('" + window.addApiUrlIfNeeded(group.logo) + "')" }}
            >
              {((group.mininame || group.name || '') + '-')[0].toUpperCase()}
            </div>
          </div>
          <span className="companyName">{group.name}</span>
        </div>
        <div className="right">
          <a href="https://twake.app" target="_BLANK">
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
      <div className="main-view public">
        {(this.routeState.appName === 'drive' && (
          <Drive key={this.routeState.appName} channel={null} tab={null} options={options} />
        )) ||
          noapp}
      </div>,
      <MenusBodyLayer />,
      <Viewer />,
    ];
  }
}
