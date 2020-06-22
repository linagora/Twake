import React, { Component } from 'react';
import './integration.scss';

export default class Integration extends Component {
  render() {
    const branding = {
      /*
      header: true,
      logo: 'https://openpaas.linagora.com/images/white-logo.svg',
      color: '#2196F3',
      default_border_radius: '2',
      apps: [],*/
    };

    if (branding.color) {
      document.documentElement.style.setProperty('--primary', branding.color);
      document.documentElement.style.setProperty(
        '--primary-background',
        branding.color.substr(0, 7) + '22',
      );
      document.documentElement.style.setProperty(
        '--primary-hover',
        branding.color.substr(0, 7) + 'AA',
      );
      document.documentElement.style.setProperty('--secondary', '#38383d');
    }
    if (branding.default_border_radius) {
      document.documentElement.style.setProperty(
        '--default-border-radius',
        branding.default_border_radius + 'px',
      );
    }

    return (
      <div className="integration">
        <div className="integration-header">
          {branding.logo && (
            <div className="logo" style={{ backgroundImage: 'url(' + branding.logo + ')' }} />
          )}
          <div className="apps"></div>
        </div>
        <div className="integrated-app">{this.props.children}</div>
      </div>
    );
  }
}
