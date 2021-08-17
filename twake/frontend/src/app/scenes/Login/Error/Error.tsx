// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useEffect, useState } from 'react';
import { Button } from 'antd';

import Languages from 'services/languages/languages';
import Emojione from 'components/Emojione/Emojione';
import WindowState from 'services/utils/window';

import './Error.scss';

export default () => {
  const [parsedErrorCode, setParsedErrorCode] = useState('');
  const [errorCode, setErrorCode] = useState('');

  useEffect(() => {
    const errorCode = WindowState.findGetParameter('error_code');

    if (errorCode) {
      try {
        const { error } = JSON.parse(errorCode);
        setParsedErrorCode(error);
        setErrorCode(errorCode);
      } catch(err) {
        setParsedErrorCode('Unable to parse error');
        setErrorCode(errorCode);
      }
    }
  }, []);

  return (
    <div className="full_page_error_login">
      <div className="error_message skew_in_top_nobounce">
        <div className="title">
          <Emojione type="❌" size={32} />{' '}
          {Languages.t('scenes.login_error', [], 'There was an error while logging you into Twake')}
        </div>
        <div className="subtitle">{parsedErrorCode}</div>

        {errorCode}

        <br />
        <br />
        <br />

        <Button
          type="primary"
          onClick={() => {
            document.location.replace('/login?auto=1');
          }}
        >
          {Languages.t('scenes.login_error_retry', [], 'Try again')}
        </Button>
      </div>
    </div>
  );
};
