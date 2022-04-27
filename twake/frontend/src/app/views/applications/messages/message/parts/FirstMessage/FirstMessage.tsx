import React from 'react';
import Languages from 'app/features/global/services/languages-service';

import Emojione from 'components/emojione/emojione';
import './FirstMessage.scss';

export default React.memo(() => {
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
});
