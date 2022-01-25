import React from 'react';

import { ChannelResource } from 'app/features/channels/types/channel';
import Messages from './messages';
import { ViewConfiguration } from 'app/services/AppView/AppViewService';

import './messages.scss';

type Props = {
  channel: ChannelResource;
  tab?: any;
  options: ViewConfiguration;
};

/**
 * Instanciate a Messages component with a good unicity key
 */
export default (props: Props) => {
  if (!props.channel) {
    return <></>;
  }

  return (
    <Messages
      channel={props.channel}
      options={props.options}
      key={`${props.options?.context?.threadId}${props.channel?.id}`}
    />
  );
};
