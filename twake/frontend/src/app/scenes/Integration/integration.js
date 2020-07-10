import React, { Component } from 'react';
import LoginService from 'services/login/login.js';
import AppsIcon from '@material-ui/icons/Apps';
import Popover from '@material-ui/core/Popover';
import IconButton from '@material-ui/core/IconButton';
import Apps from './Components/Apps.js';
import './integration.scss';

export default class Integration extends Component {
  constructor() {
    super();

    this.state = {
      login: LoginService,
    };

    LoginService.addListener(this);
  }
  render() {
    if (!this.state.login.server_infos_loaded) {
      return this.props.children;
    }

    let branding = this.state.login.server_infos.branding;

    if (!(branding || {}).name) {
      return this.props.children;
    }

<<<<<<< HEAD
    if (branding.style && branding.style.color) {
=======
    if (branding.style.color) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      document.documentElement.style.setProperty('--primary', branding.style.color);
      document.documentElement.style.setProperty(
        '--primary-background',
        branding.style.color.substr(0, 7) + '22',
      );
      document.documentElement.style.setProperty(
        '--primary-hover',
        branding.style.color.substr(0, 7) + 'AA',
      );
      document.documentElement.style.setProperty('--secondary', '#38383d');
    }
<<<<<<< HEAD
    if (branding.style && branding.style.default_border_radius) {
=======
    if (branding.style.default_border_radius) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      document.documentElement.style.setProperty(
        '--default-border-radius',
        branding.style.default_border_radius + 'px',
      );
    }

    return (
      <div className="integration">
        {branding.header && (
          <div className="integration-header">
            {(branding.header.logo || branding.logo) && (
              <div
                className="logo"
                style={{ backgroundImage: 'url(' + (branding.header.logo || branding.logo) + ')' }}
              />
            )}
            <div className="apps">
              <Apps apps={branding.header.apps} />
            </div>
          </div>
        )}
        <div className="integrated-app">{this.props.children}</div>
      </div>
    );
  }
}
