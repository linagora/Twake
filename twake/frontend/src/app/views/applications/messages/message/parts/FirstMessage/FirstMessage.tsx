import React from 'react';
import Languages from 'services/languages/languages';

import Emojione from 'components/Emojione/Emojione';
import './FirstMessage.scss';

export default () => {
  return (
    <div className="first_message">
      <div className="content">
        <div className="icon">
          <Emojione s128 type={'🥇'} />
        </div>
        <div className="text">
          {Languages.t('scenes.apps.messages.message.types.first_channel_message_text')}
        </div>
      </div>
    </div>
  );
};
