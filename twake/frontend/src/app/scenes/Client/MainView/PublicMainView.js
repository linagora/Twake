import React, { Component } from 'react';

import Languages from 'services/languages/languages';
import Collections from 'app/services/Depreciated/Collections/Collections';
import Drive from 'app/scenes/Apps/Drive/DriveContent';
import Api from 'services/Api';
import RouterService from 'services/RouterService';
import MenusBodyLayer from 'components/Menus/MenusBodyLayer';
import Viewer from 'scenes/Apps/Drive/Viewer/Viewer';
import { addApiUrlIfNeeded } from 'app/services/utils/URLUtils';

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
    Api.post(
      '/ajax/workspace/get_public_data',
      { workspace_id: this.routeState.workspaceId },
      res => {
        if (res && res.data) {
          this.state.group = {
            name: res.data.group_name,
            logo: addApiUrlIfNeeded(res.data.group_logo),
          };
          this.setState({});
        }
      },
    );
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
              style={{ backgroundImage: addApiUrlIfNeeded(group.logo, true) }}
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
