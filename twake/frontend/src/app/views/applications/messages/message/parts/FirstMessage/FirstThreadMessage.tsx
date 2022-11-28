import React from 'react';
import Languages from 'app/features/global/services/languages-service';
import './FirstMessage.scss';

export default ({ noReplies }: { noReplies?: boolean }) => {
  return (
    <div className="first_message">
      <div className="content">
        <div className="text">
          {noReplies
            ? Languages.t('scenes.apps.messages.message.types.no_message_in_thread')
            : Languages.t('scenes.apps.messages.message.types.first_message_text')}
        </div>
      </div>
    </div>
  );
};
