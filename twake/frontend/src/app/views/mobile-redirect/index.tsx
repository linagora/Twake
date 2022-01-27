import React, { ReactNode } from 'react';
import { getDevice } from '../../features/global/utils/device';
import environment from '../../environment/environment';

export default function MobileRedirect(props: { children: ReactNode }) {
  const os = getDevice();

  //For desktop we don't show the open on app popup
  if (os === 'other' || !environment.use_mobile_redirect || typeof window === 'undefined') {
    return <>{props.children}</>;
  }

  //For mobile first we ensure to be on the m.domain.com url
  if (window.location.hostname.indexOf('m.') !== 0) {
    window.location.replace(
      //The redirection to the app MUST be from ANOTHER domain to work in devices webviews (like in facebook messenger)
      `${window.location.protocol}//${'m.' + window.location.hostname.replace('m.', '')}/${
        window.location.pathname
      }${window.location.search}`,
    );
    return <div></div>;
  }

  //Here we are on m.domain.com/some-path and we are on a mobile device
  const mobileUrl = `${window.location.protocol}//${window.location.hostname.replace('m.', '')}/${
    window.location.pathname
  }${window.location.search}`;

  return (
    <>
      {props.children}
      <div>
        <a>Open on mobile app</a>
        <a>Continue on web</a>
      </div>
    </>
  );
}
