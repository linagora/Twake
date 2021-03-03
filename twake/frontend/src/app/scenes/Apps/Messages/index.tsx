import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import ChannelsService from 'services/channels/channels.js';
import MessagesList from './MessagesList';
import './Messages.scss';
import NewThread from './Input/NewThread';
import DroppableZone from 'components/Draggable/DroppableZone.js';
import MessagesListServerServicesManager from 'app/services/Apps/Messages/MessagesListServerUtils';
import Collections from 'app/services/Collections/Collections';
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
      key={props.options?.context?.threadId + props.channel?.id}
    />
  );
};
