import React, { ReactNode, useState } from 'react';
import { getDevice } from '../../features/global/utils/device';
import configuration from '../../environment/environment';
import { Smartphone, X } from 'react-feather';
import './style.scss';
import { Button } from 'antd';
import InitService from '../../features/global/services/init-service';

const environment = configuration as any;

export default function MobileRedirect(props: { children: ReactNode }) {
  const os = getDevice();
  const searchParams = Object.fromEntries(new URLSearchParams(window.location.search)) as any;

  const parameters = InitService.server_infos?.configuration.mobile;

  const getapp = searchParams.getapp;
  const forceUseWeb = searchParams.useweb;
  const originInUrl = searchParams.origin;

  delete searchParams.useweb;
  delete searchParams.getapp;
  delete searchParams.origin;

  //If requested in url: redirect to stores
  if (getapp && parameters?.mobile_appstore && parameters?.mobile_googleplay) {
    if (os === 'android') {
      document.location.replace(parameters?.mobile_googleplay);
    } else if (os === 'ios') {
      document.location.replace(parameters?.mobile_appstore);
    }
  }

  //For desktop we don't show the open on app popup
  if (
    forceUseWeb ||
    os === 'other' ||
    !parameters?.mobile_redirect ||
    (!environment?.front_root_url && !originInUrl) ||
    typeof window === 'undefined'
  ) {
    return <>{props.children}</>;
  }

  const origin = (originInUrl || environment?.front_root_url)
    .replace(/https?:\/\//g, '')
    .replace(/\//g, '');
  const redirectOrigin = parameters?.mobile_redirect.replace(/https?:\/\//g, '').replace(/\//g, '');

  //For mobile first we ensure to be on the m.domain.com url
  if (window.location.origin.replace(/https?:\/\//g, '').replace(/\//g, '') !== redirectOrigin) {
    window.location.replace(
      //The redirection to the app MUST be from ANOTHER domain to work in devices webviews (like in facebook messenger)
      `${window.location.protocol}//${redirectOrigin}${
        window.location.pathname
      }?${new URLSearchParams(
        Object.assign(searchParams, { origin: window.location.origin }),
      ).toString()}`,
    );
    return <div></div>;
  }

  //Here we are on m.domain.com/some-path and we are on a mobile device
  const backToWebUrl = (getApp: boolean = true) =>
    `${window.location.protocol}//${origin}${window.location.pathname}?${new URLSearchParams(
      Object.assign({}, searchParams, getApp ? { getapp: 1 } : { useweb: 1 }),
    ).toString()}`;

  return (
    <>
      {!forceUseWeb && (
        <div className="mobile_redirect_container">
          <div className="open_on_mobile">
            <span className="open_on_mobile_title">Open Twake in...</span>
            <a className="open_on_mobile_actions" href={backToWebUrl()}>
              <Smartphone /> <span>Twake App</span>
              <span style={{ flex: 1 }}></span>
              <Button className="action_button" type="primary">
                Open
              </Button>
            </a>
            <span
              className="open_on_mobile_actions"
              onClick={() => document.location.replace(backToWebUrl(false))}
            >
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
