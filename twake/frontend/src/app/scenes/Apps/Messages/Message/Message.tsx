import React, { useContext } from 'react';
import { useMessage } from 'app/state/recoil/hooks/useMessage';
import { MessageContext } from './MessageWithReplies';
import MessageContent from './Parts/MessageContent';

type Props = {};

export default (props: Props) => {
  return <MessageContent />;
};
