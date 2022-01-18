import { useMessage } from 'app/state/recoil/hooks/messages/useMessage';
import { useMessageEditor } from 'app/state/recoil/hooks/messages/useMessageEditor';
import React, { useContext, useEffect } from 'react';
import Languages from 'services/languages/languages';
import { MessageContext } from '../message-with-replies';

type Props = {};

export default (props: Props) => {
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
