import React from 'react';
import Languages from 'services/languages/languages';
import Emojione from 'components/Emojione/Emojione';
import LoginService from 'services/login/login.js';
import './Error.scss';
import RouterServices from 'app/services/RouterServices';
import InitService from 'services/InitService';

export default () => {
  let state = RouterServices.history.location.state as any;
  if (!state || !state?.error?.name) {
    state = {
      error: {
        name: '404',
        info: 'Error not found',
      },
    };
    if (!RouterServices.useRedirection()) {
      RouterServices.history.push('/');
    }
  }
  return (
    <div className="full_page_error">
      <div className="error_message skew_in_top_nobounce">
        <div className="title">
          <Emojione type="👨‍🚀" size={32} />{' '}
          {Languages.t('scenes.error_on_twake', 'You found an error on the Twake platform !')}
        </div>
        <div className="subtitle">
          {Languages.t('scenes.no_panic', "Don't panic! Just reload this page to fix Twake.")}
        </div>
        <div className="text">
          {Languages.t(
            'scenes.help_us',
            'However, if you would like to help us fix this error, send us a message below: ',
          )}
          <br />
          <br />
          <textarea
            className="input medium full_width"
            style={{ height: 200, overflow: 'scroll', maxHeight: '50vh' }}
            readOnly
            onClick={(evt: any) => {
              evt.target.focus();
              evt.target.select();
            }}
          >
            {state.error.name + '\n----------------------------\n' + state.error.info}
          </textarea>
          <br />
          <br />
          {InitService.server_infos?.help_link && (
            <span>
              {Languages.t('scenes.tell_us', [], 'Please tell us what you were doing at :')}
              <br />
              <a href="#" onClick={() => window.open(InitService.server_infos?.help_link + '')}>
                {InitService.server_infos?.help_link}
              </a>
              <br />
              <br />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
