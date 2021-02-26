import React from 'react';
import Languages from 'services/languages/languages.js';

export default (props: { force?: boolean; children: React.ReactNode }): JSX.Element => {
  if (!props.force && ((window as any).screen.width < 300 || (window as any).screen.height < 400)) {
    (window as any).document.getElementById('app_loader').classList.remove('load');

    var valid_browser = false;
    if ('querySelector' in document && 'localStorage' in window && 'addEventListener' in window) {
      valid_browser = true;
    }

    var ios = false;
    if (/iPad|iPhone|iPod/.test((window as any).userAgent) && !window.MSStream) {
      ios = true;
    }

    return (
      <div className="twake_bad_device">
        <div className="top">
          <div className="title">{Languages.t('twake_not_on_device')}</div>
        </div>
        <div className="bottom">
          <div className="subtitle">
            {valid_browser && Languages.t('twake_not_on_device_mobile')}
            {!valid_browser && Languages.t('twake_not_on_device_browser')}
          </div>
          {valid_browser && (
            <div>
              <img
                className="store_img"
                src="/public/img/appstore.png"
                onClick={() => {
                  (window as any).document.location =
                    'https://apps.apple.com/us/app/twake/id1257653795?l=fr&ls=1';
                }}
              />
              {!ios && (
                <img
                  className="store_img"
                  src="/public/img/googleplay.png"
                  onClick={() => {
                    (window as any).document.location =
                      'https://play.google.com/store/apps/details?id=com.twake.twake&hl=fr';
                  }}
                />
              )}
            </div>
          )}
          {!valid_browser && (
            <div className="link">
              <a href="https://twakeapp.com">twakeapp.com</a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{props.children}</>;
};
