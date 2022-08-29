import React from 'react';
import { MessageDeliveryStatusType } from 'app/features/messages/types/message';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble, faClock, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

type PropsType = {
  status: MessageDeliveryStatusType | null | undefined;
}

export default ({ status }: PropsType) => {
  const messageStatus = status ?? 'read';

  return (
    <div className="message-delivery-status float-right">
      {messageStatus === 'sending' && <FontAwesomeIcon icon={faClock} className="text-zinc-500" />}
      {messageStatus === 'sent' && <FontAwesomeIcon icon={faCheck} className="text-zinc-500" />}
      {messageStatus === 'delivered' && (
        <FontAwesomeIcon icon={faCheckDouble} className="text-zinc-500" />
      )}
      {messageStatus === 'read' && (
        <FontAwesomeIcon icon={faCheckDouble} className="text-blue-500" />
      )}
      {messageStatus === 'error' && <FontAwesomeIcon icon={faTimes} className="text-red-500" />}
    </div>
  );
}
