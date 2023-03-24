import { useMessage } from 'app/features/messages/hooks/use-message';
import { useMessageEditor } from 'app/features/messages/hooks/use-message-editor';
import React, { useContext } from 'react';
import Languages from 'app/features/global/services/languages-service';
import { MessageContext } from '../message-with-replies';

export default () => {
  const context = useContext(MessageContext);
  const { message } = useMessage(context);
  const { retry, cancel } = useMessageEditor(context);

  return (
    <div>
      <span
        className="link"
        style={{ fontWeight: 500, marginRight: 8 }}
        onClick={() => retry(message)}
      >
        {Languages.t('general.retry')}
      </span>
      <span className="link red" style={{ fontWeight: 500 }} onClick={() => cancel(message)}>
        {Languages.t('general.remove')}
      </span>
    </div>
  );
};
