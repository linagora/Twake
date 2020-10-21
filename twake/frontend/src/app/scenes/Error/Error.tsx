import React from 'react';
import Languages from 'services/languages/languages';
import Emojione from 'components/Emojione/Emojione';
import LoginService from 'services/login/login.js';
import './Error.scss';
import RouterServices from 'app/services/RouterServices';

export default () => {
  let state = RouterServices.history.location.state as any;
  if (!state || !state?.error?.name) {
    state = {
      error: {
        name: '404',
        info: 'Error not found',
      },
    };
  }
  return (
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
            onClick={(evt: any) => {
              evt.target.focus();
              evt.target.select();
            }}
          >
            {state.error.name + '\n----------------------------\n' + state.error.info}
          </textarea>
          <br />
          <br />
          {LoginService.server_infos?.help_link && (
            <span>
              {Languages.t('scenes.tell_us', [], 'Please tell us what you were doing at :')}
              <br />
              <a href="#" onClick={() => window.open(LoginService.server_infos?.help_link + '')}>
                {LoginService.server_infos?.help_link}
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
