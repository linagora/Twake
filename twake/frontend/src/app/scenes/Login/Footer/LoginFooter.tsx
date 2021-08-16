// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { Typography } from 'antd';

import Globals from 'services/Globals';
import Languages from 'services/languages/languages';
import Icon from 'components/Icon/Icon';
import { ServerInfoType } from 'app/services/InitService';

import './LoginFooter.scss';

export default (props: { serverInfo?: ServerInfoType }): JSX.Element => {
  return (
    <>
      <div className="app_version_footer">
        <div className="version_name fade_in">Twake {Globals.version.version_name}</div>
        <div style={{ height: 20 }}>
          {props.serverInfo?.configuration?.branding?.name && (
            <div className="smalltext fade_in">
              {props.serverInfo?.configuration?.branding?.name &&
                Languages.t('scenes.login.footer.branding', [
                  props.serverInfo?.configuration?.branding?.name,
                  props.serverInfo?.configuration?.branding.link || 'twake.app',
                ])}
              <Typography.Link onClick={() => window.open('https://twakeapp.com', 'blank')}>
                {Languages.t('scenes.login.footer.go_to_twake')}
              </Typography.Link>
              {` - ${Globals.version.version}`}
            </div>
          )}
          {!props.serverInfo?.configuration?.branding?.name && (
            <Typography.Link
              className="fade_in"
              onClick={() => window.open('https://twakeapp.com', 'blank')}
            >
              {Languages.t('scenes.login.footer.go_to_twake')}
            </Typography.Link>
          )}
        </div>
      </div>

      <div className="help_footer">
        {props.serverInfo?.configuration?.help_url && (
          <Typography.Link
            className="blue_link fade_in"
            onClick={() =>
              window.open(props.serverInfo?.configuration?.help_url || '', 'blank')
            }
          >
            <Icon type="question-circle" /> {Languages.t('general.help')}
          </Typography.Link>
        )}
      </div>
    </>
  );
};
