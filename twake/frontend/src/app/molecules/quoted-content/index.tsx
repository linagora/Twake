import { Base } from 'app/atoms/text';
import Languages from 'app/features/global/services/languages-service';
import { MessageWithReplies } from 'app/features/messages/types/message';
import PossiblyPendingAttachment from 'app/views/applications/messages/message/parts/PossiblyPendingAttachment';
import React from 'react';
import { Image } from 'react-feather';

type PropsType = {
  message: MessageWithReplies;
};

export default ({ message }: PropsType): React.ReactElement => {
  return message.text && message.text.length ? (
    <Base>{message.text}</Base>
  ) : message.files?.[0] ? (
    <PossiblyPendingAttachment file={message.files?.[0]} type="message" />
  ) : (
    <div className="flex flex-row space-x-2">
      <Image size={20} />
      <Base>{Languages.t('molecules.quoted_content.attachement')}</Base>
    </div>
  );
};
