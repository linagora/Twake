import React from 'react';

import './Messages.scss';
import { ChannelResource } from 'app/models/Channel';
import Messages from './Messages';

type Props = {
  channel: ChannelResource;
  tab?: any;
  options: any;
};

/**
 * Instanciate a Messages component with a good unicity key
 */
export default (props: Props) => {
  return (
    <Messages
      channel={props.channel}
      options={props.options}
      key={`${props.options?.context?.threadId}${props.channel?.id}`}
    />
  );
};
