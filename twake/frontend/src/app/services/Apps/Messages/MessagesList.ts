import React from 'react';

/*
  This class will manage what is loaded from the backend and what's not, the complete list of messages for a channel will always be h
*/
export default class MessagesListUtils {
  channelId: string = '';
  threadId: string = '';
  firstLoadedMessageId: string = '';
  lastLoadedMessageId: string = '';
  lastRealtimeMessageId: string = '';

  constructor() {}
}
