import React, { Component } from 'react';
import Languages from 'services/languages/languages.js';

import LoginService from 'services/login/login.js';
import Emojione from 'components/Emojione/Emojione';
import './ui.scss';
import './ui_new.scss';

import Login from 'scenes/Login/login.js';
import TwakeNotReady from 'scenes/Login/TwakeNotReady/TwakeNotReady';
import AppPage from 'scenes/App/app.js';
import Workspaces from 'services/workspaces/workspaces.js';
import WelcomePage from 'scenes/App/Popup/WelcomePage/WelcomePage.js';
import Globals from 'services/Globals.js';
import WindowService from 'services/utils/window.js';

export default class App extends Component {
  constructor() {
    super();

    this.state = {
      login: LoginService,
      willGoToApp: false,
      hasError: false,
      componentTest: window.localStorage.getItem('componentTest'),
    };

    LoginService.addListener(this);

    Workspaces.setWelcomePage(<WelcomePage />);
  }
  componentWillUnmount() {
    LoginService.removeListener(this);
  }
  animatedGradientBackground() {
    var setGradientOfHour = function () {
      document.body.style.backgroundPosition =
        '0 ' + 100 * ((new Date().getHours() - 6) / 24) + '%';
    };
    setInterval(() => {
      setGradientOfHour();
    }, 60000);
    setTimeout(() => {
      document.body.style.transition = 'background-position 60s';
    }, 1000);
    setGradientOfHour();
  }
  componentDidMount() {
    LoginService.init();
    this.animatedGradientBackground();

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
  shouldComponentUpdate(nextProps, nextState) {
    if (this.page_state && nextState.login.state == 'app' && this.page_state != 'app') {
      nextState.willGoToApp = true;
      setTimeout(() => {
        console.log('go to app');
        this.setState({ willGoToApp: false });
      }, 500);
    }
    this.page_state = nextState.login.state;
    return true;
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error: [error] };
  }
  componentDidCatch(error, info) {
    if (!this.state.hasError) {
      if (Globals.window.mixpanel_enabled)
        Globals.window.mixpanel.track(Globals.window.mixpanel_prefix + 'Front Crashed', {
          error: error,
          info: info.componentStack,
        });

      this.state.hasError = true;
      this.setState({ hasError: true, error: [error, info] });
    }
  }
  render() {
    var page = [];

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

    if (this.state.hasError) {
      page.push(
        <div className="full_page_error" key="page_error">
          <div className="error_message skew_in_top_nobounce">
            <div className="title">
              <Emojione type=":boom:" /> {Languages.t('scenes.aie', [], 'Aïe !')}
            </div>
            <div className="subtitle">
              {Languages.t(
                'scenes.error_on_twake',
                [],
                'Vous avez trouvé une erreur sur la plateforme Twake !',
              )}
            </div>
            <div className="text">
              {Languages.t(
                'scenes.no_panic',
                [],
                'Pas de panique, il vous suffit de recharger cette page pour retrouver Twake.',
              )}
              <br />
              {Languages.t(
                'scenes.help_us',
                [],
                'Cependant si vous souhaitez nous aider à réparer cette erreur, envoyer nous le message ci-dessous :',
              )}
              <br />
              <br />
              <textarea
                className="input medium full_width"
                readOnly
                style={{ height: 200, overflow: 'scroll' }}
                onClick={evt => {
                  evt.target.focus();
                  evt.target.select();
                }}
              >
                {this.state.error[0] +
                  '\n----------------------------\n' +
                  this.state.error[1].componentStack}
              </textarea>
              <br />
              <br />
              {LoginService.server_infos.help_link && (
                <span>
                  {Languages.t('scenes.tell_us', [], 'Please tell us what you were doing at :')}
                  <br />
                  <a href="#" onClick={() => window.open(LoginService.server_infos.help_link)}>
                    {LoginService.server_infos.help_link}
                  </a>
                  <br />
                  <br />
                </span>
              )}
            </div>
          </div>
        </div>,
      );

      return page;
    }

    if (
      this.state.login.server_infos_loaded &&
      this.state.login.server_infos.ready != true &&
      this.state.login.server_infos.ready !== undefined
    ) {
      page = [<TwakeNotReady key="twake_not_ready" ready={this.state.login.server_infos.ready} />];
    } else if (!this.state.login.firstInit || !this.state.login.server_infos_loaded) {
      page = [<div className="white_full_background" key="white_full_background" />];
    } else {
      document.getElementById('app_loader').classList.remove('load');

      if (public_access || (this.state.login.state == 'app' && !this.state.willGoToApp)) {
        page = [<AppPage key="app_page" />];
      } else {
        page = [<Login key="login_page" willGoToApp={this.state.willGoToApp} />];
      }
    }

    return page;
  }
}
