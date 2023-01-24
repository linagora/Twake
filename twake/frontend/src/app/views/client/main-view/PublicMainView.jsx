import React, { Component } from 'react';

import Languages from 'app/features/global/services/languages-service';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections';
import Drive from 'app/views/applications/drive';
import Api from 'app/features/global/framework/api-service';
import RouterService from 'app/features/router/services/router-service';
import MenusBodyLayer from 'app/components/menus/menus-body-layer';
import { addApiUrlIfNeeded } from 'app/features/global/utils/URLUtils';

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
  shouldComponentUpdate() {
    return true;
  }
  routeState = RouterService.getStateFromRoute();
  componentDidMount() {
    Api.get(
      '/internal/services/users/v1/companies/' + this.routeState.companyId,
      res => {
        if (res && res.data) {
          this.setState({
            ...this.state,
            group: {
            name: res.resource.name,
            logo: addApiUrlIfNeeded(res.resource.logo),
          }
          });
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

    return (
      <div className="flex flex-col h-full w-full">
        <div className="public_header">
          <div className="left">
            <span className="companyName">{group.name}</span>
          </div>
          <div className="right">
            <a href="https://twake.app" target="_BLANK" rel="noreferrer" className="!text-white">
              <span className="nomobile text-white">
                {Languages.t(
                  'scenes.app.mainview.create_account',
                  [],
                  'Créez votre espace de travail gratuitement sur ',
                )}
              </span>
              Twake &nbsp; 👉
            </a>
          </div>
        </div>
        <div className="main-view public ">
          {(this.routeState.appName === 'drive' && (
            <Drive key={this.routeState.appName} channel={null} tab={null} options={options} />
          )) ||
            noapp}
        </div>
        <MenusBodyLayer />
      </div>
    );
  }
}
