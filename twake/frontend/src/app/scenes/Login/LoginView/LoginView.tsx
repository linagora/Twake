// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useEffect, useState } from 'react';
import { Typography } from 'antd';

import Languages from 'services/languages/languages';
import LoginService from 'services/login/LoginService';
import Emojione from 'components/Emojione/Emojione';
import Button from 'components/Buttons/Button';
import Input from 'components/Inputs/Input';
import InitService from 'services/InitService';

export default (): JSX.Element => {
  LoginService.useListener(useState);
  const [form, setForm] = useState<{ login: string; password: string }>({ login: '', password: '' });

  useEffect(() => {
    if (
      InitService.server_infos?.configuration?.accounts?.type !== 'internal' &&
      !(LoginService.external_login_error || false)
    ) {
      LoginService.loginWithExternalProvider(
        InitService.server_infos?.configuration?.accounts?.type,
      );
    }
  }, []);

  if (
    InitService.server_infos?.configuration?.accounts?.type !== 'internal' &&
    !(LoginService.external_login_error || false)
  ) {
    return <></>;
  }

  return (
    <div className="center_box_container login_view skew_in_bottom_nobounce">
      <div className="center_box white_box_with_shadow">
        <div className="title">
          {!((InitService.server_infos || {}).branding || {}).logo &&
            Languages.t('scenes.login.home.title')}
        </div>

        {!((InitService.server_infos || {}).branding || {}).logo && (
          <div className="subtitle" style={{ marginBottom: 24 }}>
            {Languages.t('scenes.login.home.subtitle')} <Emojione type=":innocent:" />
          </div>
        )}

        {!!((InitService.server_infos || {}).branding || {}).logo && (
          <img
            alt={((InitService.server_infos || {}).branding || {}).logo}
            style={{ marginBottom: 40, marginTop: 10, width: 140 }}
            src={((InitService.server_infos || {}).branding || {}).logo}
          />
        )}

        {LoginService.external_login_error && (
          <div id="identification_information" className="smalltext error">
            Unable to login: {LoginService.external_login_error}
          </div>
        )}

        {(Object.keys((InitService.server_infos || {}).auth || []).indexOf('internal') >= 0 ||
          ((InitService.server_infos || {}).auth || []).length === 0) && (
          <div className="internal-login">
            <Input
              id="username"
              type="text"
              className={
                'bottom-margin medium full_width ' +
                (LoginService.login_error ? 'error ' : '')
              }
              placeholder={Languages.t('scenes.login.home.email')}
              onKeyDown={(evt: any) => {
                if (evt.keyCode === 13 && !LoginService.login_loading) {
                  LoginService.login({ username: form.login, password: form.password, remember_me: true });
                }
              }}
              onChange={(evt :any) => setForm({...form, login: evt.target.value })}
            />

            <Input
              id="password"
              type="password"
              className={
                'bottom-margin medium full_width ' +
                (LoginService.login_error ? 'error ' : '')
              }
              placeholder={Languages.t('scenes.login.home.password')}
              onKeyDown={(e :any) => {
                if (e.keyCode === 13 && !LoginService.login_loading) {
                  LoginService.login({ username: form.login, password: form.password, remember_me: true });
                }
              }}
              onChange={(evt :any) => setForm({...form, password: evt.target.value })}
            />

            {LoginService.login_error && (
              <div id="identification_information" className="smalltext error">
                {Languages.t('scenes.login.home.unable_to_connect')}
              </div>
            )}

            <Button
              id="login_btn"
              type="button"
              className="medium full_width "
              style={{ marginBottom: 8 }}
              disabled={LoginService.login_loading}
              onClick={() => LoginService.login({ username: form.login, password: form.password, remember_me: true })}
            >
              {Languages.t('scenes.login.home.login_btn')}
            </Button>
            {!InitService.server_infos?.configuration?.accounts?.internal
              ?.disable_account_creation && (
              <Typography.Link
                onClick={() => LoginService.changeState('signin')}
                id="create_btn"
                className="blue_link"
              >
                {Languages.t('scenes.login.home.create_account')}
              </Typography.Link>
            )}

            <Typography.Link
              onClick={() => LoginService.changeState('forgot_password')}
              id="forgot_password_btn"
              className="blue_link"
            >
              {Languages.t('scenes.login.home.lost_password')}
            </Typography.Link>
          </div>
        )}
      </div>
    </div>
  );
};
