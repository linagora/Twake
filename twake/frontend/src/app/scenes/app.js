import React, { Component } from 'react';
import Languages from 'services/languages/languages.js';
import ClientPage from 'app/scenes/Client/Client';
import Workspaces from 'services/workspaces/workspaces.js';
import WelcomePage from 'app/scenes/Client/Popup/WelcomePage/WelcomePage.js';
import Globals from 'services/Globals.js';
import WindowService from 'services/utils/window.js';

export default class App extends Component {
  componentDidMount() {
    Workspaces.setWelcomePage(<WelcomePage />);

    document.body.addEventListener('dragover', e => {
      e.preventDefault();
    });
    document.body.addEventListener('dragenter', e => {
      e.preventDefault();
    });
    document.body.addEventListener('drop', e => {
      e.preventDefault();
    });
  }

  render() {
    var public_access = false;
    if (
      ['drive_public_access'].indexOf(WindowService.findGetParameter('view')) >= 0 ||
      Globals.store_public_access_get_data
    ) {
      public_access = true;
      Globals.store_public_access_get_data = WindowService.allGetParameter();
    }

    if (
      !public_access &&
      (Globals.window.screen.width < 400 || Globals.window.screen.height < 400)
    ) {
      document.getElementById('app_loader').classList.remove('load');

      var valid_browser = false;
      if ('querySelector' in document && 'localStorage' in window && 'addEventListener' in window) {
        valid_browser = true;
      }

      var ios = false;
      if (/iPad|iPhone|iPod/.test(window.userAgent) && !window.MSStream) {
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
                    document.location =
                      'https://apps.apple.com/us/app/twake/id1257653795?l=fr&ls=1';
                  }}
                />
                {!ios && (
                  <img
                    className="store_img"
                    src="/public/img/googleplay.png"
                    onClick={() => {
                      document.location =
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

    return <ClientPage />;
  }
}
