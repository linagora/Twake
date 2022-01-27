import React from 'react';
import Languages from 'app/features/global/services/languages-service';
import { ArrowDown } from 'react-feather';

type Props = {
  onClick: () => void;
  newMessages?: number;
};

export default (props: Props) => {
  const msg = props.newMessages
    ? Languages.t('scenes.apps.messages.messageslist.go_last_message_button.new_messages')
    : Languages.t('scenes.apps.messages.messageslist.go_last_message_button');

  return (
    <div className={'go-to-bottom'} key="go-to-bottom" onClick={() => props.onClick()}>
      <ArrowDown size={16} />
      <span>{msg}</span>
    </div>
  );
};
