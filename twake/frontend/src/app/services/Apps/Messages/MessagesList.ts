import Collections from 'services/Collections/Collections.js';

type Message = {
  application_id: string | null;
  channel_id: string;
  content: any;
  creation_date: number;
  edited: boolean;
  front_id: string;
  hidden_data: any;
  id: string;
  increment_at_time: number | null;
  message_type: 0 | 1 | 2;
  modification_date: number;
  parent_message_id: string | null;
  pinned: boolean;
  reactions: any[];
  responses_count: number | null;
  sender: string | null;
  user_specific_content: any;
};

/*
  This class will manage what is loaded from the backend and what's not, the complete list of messages for a channel will always be h
*/
export default class MessagesListUtils {
  channelId: string = '';
  threadId: string = '';
  collectionKey: string = '';
  firstLoadedMessageId: string = '';
  lastLoadedMessageId: string = '';
  lastRealtimeMessageId: string = '';

  constructor(channelId: string, threadId: string, collectionKey: string) {
    this.channelId = channelId;
    this.threadId = threadId;
    this.collectionKey = collectionKey;
    //@ts-ignore
    window.MessagesListUtils = this;
  }

  init(fromMessageId: string = '') {
    Collections.get('messages').addSource(
      {
        http_base_url: 'discussion',
        http_options: {
          channel_id: this.channelId,
          parent_message_id: this.threadId,
          limit: 20,
          offset: fromMessageId,
        },
        websockets: [{ uri: 'messages/' + this.channelId, options: { type: 'messages' } }],
      },
      this.collectionKey,
      (messages: Message[]) => {
        this.updateLastFirstMessagesId(messages);
      },
    );
  }

  loadMore(history: boolean = true) {
    const direction = history ? 1 : -1;
    const offset = history ? this.firstLoadedMessageId : this.lastLoadedMessageId;
    Collections.get('messages').sourceLoad(
      this.collectionKey,
      { offset: offset, limit: direction * 20 },
      (messages: Message[]) => {
        this.updateLastFirstMessagesId(messages);
      },
    );
  }

  updateLastFirstMessagesId(messages: Message[]) {
    //Todo
  }

  destroy() {}
}
