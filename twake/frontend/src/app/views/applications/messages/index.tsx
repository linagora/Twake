import React from 'react';

import { ChannelType } from 'app/features/channels/types/channel';
import Messages from './messages';
import { ViewConfiguration } from 'app/features/router/services/app-view-service';

import './messages.scss';

type Props = {
  channel: ChannelType;
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
