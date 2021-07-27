import React from 'react';
import Languages from 'services/languages/languages';
import Emojione from 'components/Emojione/Emojione';
import './Error.scss';
import RouterServices from 'app/services/RouterService';
import InitService from 'services/InitService';
import ErrorBoundary from './ErrorBoundary';

export default () => {
  let state = ErrorBoundary.lastError;
  if (!state || !state?.error?.name) {
    state = {
      error: {
        info: 'Error not found',
      },
    };
    if (!RouterServices.useRedirection()) {
      RouterServices.push('/');
    }
  }

  InitService.removeLoader();

  return (
    <div className="full_page_error">
      <div className="error_message skew_in_top_nobounce">
        <div className="title">
          <Emojione type="👨‍🚀" size={32} />{' '}
          {Languages.t('scenes.error_on_twake', [], 'You found an error on the Twake platform !')}
        </div>
        <div className="subtitle">
          {Languages.t('scenes.no_panic', [], "Don't panic! Just reload this page to fix Twake.")}
        </div>
        {state?.error?.name && (
          <div className="text">
            {Languages.t(
              'scenes.help_us',
              [],
              'However, if you would like to help us fix this error, send us a message below: ',
            )}
            <br />
            <br />
            <textarea
              className="input medium full_width"
              style={{ height: 200, overflow: 'scroll', maxHeight: '50vh', padding: 16 }}
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
            {InitService.server_infos?.configuration?.help_url && (
              <span>
                {Languages.t('scenes.tell_us', [], 'Please tell us what you were doing at :')}
                <br />
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a
                  href="#"
                  onClick={() =>
                    window.open(InitService.server_infos?.configuration?.help_url + '')
                  }
                >
                  {InitService.server_infos?.configuration?.help_url}
                </a>
                <br />
                <br />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
