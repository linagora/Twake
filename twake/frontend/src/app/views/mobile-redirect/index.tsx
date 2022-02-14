import React, { ReactNode, useState } from 'react';
import { getDevice } from '../../features/global/utils/device';
import environment from '../../environment/environment';
import { Smartphone, X } from 'react-feather';
import './style.scss';
import { Button } from 'antd';

export default function MobileRedirect(props: { children: ReactNode }) {
  const os = getDevice();
  const [closed, setClosed] = useState(false);

  if (
    new URLSearchParams(window.location.search).get('getapp') &&
    environment.mobile_appstore &&
    environment.mobile_googleplay
  ) {
    if (os === 'android') {
      document.location.replace(environment.mobile_googleplay);
    } else if (os === 'ios') {
      document.location.replace(environment.mobile_appstore);
    }
  }

  //For desktop we don't show the open on app popup
  if (
    os === 'other' ||
    !environment.mobile_domain ||
    !environment.front_root_url ||
    typeof window === 'undefined'
  ) {
    return <>{props.children}</>;
  }

  const origin = environment.front_root_url.replace(/https?:\/\//g, '').replace(/\//g, '');
  const redirectOrigin = environment.mobile_domain.replace(/https?:\/\//g, '').replace(/\//g, '');

  //For mobile first we ensure to be on the m.domain.com url
  if (window.location.origin.replace(/https?:\/\//g, '').replace(/\//g, '') !== redirectOrigin) {
    window.location.replace(
      //The redirection to the app MUST be from ANOTHER domain to work in devices webviews (like in facebook messenger)
      `${window.location.protocol}//${redirectOrigin}${window.location.pathname}${window.location.search}`,
    );
    return <div></div>;
  }

  //Here we are on m.domain.com/some-path and we are on a mobile device
  const backToWebUrl = `${window.location.protocol}//${origin}${window.location.pathname}${
    window.location.search
  }${window.location.search ? '&' : '?'}getapp=1`;

  return (
    <>
      {props.children}
      {!closed && (
        <div className="mobile_redirect_container">
          <div className="open_on_mobile">
            <span className="open_on_mobile_title">Open Twake in...</span>
            <a className="open_on_mobile_actions" href={backToWebUrl}>
              <Smartphone /> <span>Twake App</span>
              <span style={{ flex: 1 }}></span>
              <Button className="action_button" type="primary">
                Open
              </Button>
            </a>
            <span className="open_on_mobile_actions" onClick={() => setClosed(true)}>
              <X /> <span>Continue on web</span>
              <span style={{ flex: 1 }}></span>
              <Button className="action_button" type="ghost">
                Continue
              </Button>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
