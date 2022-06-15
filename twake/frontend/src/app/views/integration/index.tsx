import React from 'react';

import InitService from 'app/features/global/services/init-service';
import Apps from './components/apps.js';

import './styles.scss';

export default (props: { children: React.ReactNode }): JSX.Element => {
  const server_infos = InitService.useWatcher(
    () => InitService.server_infos_loaded && InitService.server_infos,
  );

  if (!server_infos) {
    return <></>;
  }

  const branding = (server_infos && server_infos?.configuration?.branding) || {};

  if (!(branding || {}).name) {
    return <>{props.children}</>;
  }

  if (branding.style && branding.style.color) {
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
  if (branding.style && branding.style.default_border_radius) {
    document.documentElement.style.setProperty(
      '--border-radius-base',
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
      <div className="integrated-app">{props.children}</div>
    </div>
  );
};
