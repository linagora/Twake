import Collections from 'services/Collections/Collections.js';
import Numbers from 'services/utils/Numbers.js';

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
  //Configuration
  numberOfLoadedMessages: number = 20;

  //Contructor
  channelId: string = '';
  threadId: string = '';
  collectionKey: string = '';

  //Inner logic variables
  firstMessageOfAll: string = '';
  firstLoadedMessageId: string = '';
  lastLoadedMessageId: string = '';
  lastMessageOfAllLoaded: string = '';
  httpLoading: boolean = false;
  lastRealtimeMessageId: string = '';

  constructor(channelId: string, threadId: string, collectionKey: string) {
    this.channelId = channelId;
    this.threadId = threadId;
    this.collectionKey = collectionKey;
    //@ts-ignore
    window.MessagesListUtils = this;
  }

  //Init messages and reset almost everything.
  // Option 1: no parameters or true = init at the end of the conversation
  // Option 2: from parameters = init next to a defined message
  async init(fromMessageId: string | boolean = false) {
    if (this.httpLoading) {
      return;
    }

    this.reset();

    if (fromMessageId) {
      if (typeof fromMessageId === 'string') {
        return this.loadMore(false, fromMessageId);
      } else {
        return this.loadMore(true, '');
      }
    } else {
      return new Promise(resolve => {
        this.httpLoading = true;
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
            this.httpLoading = false;
            this.updateLastFirstMessagesId(messages);
            if (!fromMessageId) this.lastMessageOfAllLoaded = this.lastLoadedMessageId;
            resolve();
          },
        );
      });
    }
  }

  //Load more messages, fromOffset can be undefined (use class variables), or a string, or an empty string (load from the end / the begining)
  async loadMore(history: boolean = true, fromOffset?: string) {
    if (this.httpLoading) {
      return;
    }

    const direction = history ? 1 : -1;
    const offset =
      typeof fromOffset === 'string'
        ? fromOffset
        : history
        ? this.firstLoadedMessageId
        : this.lastLoadedMessageId;

    return new Promise(resolve => {
      if (
        (history && this.firstMessageOfAll == offset && offset) ||
        (!history && this.lastMessageOfAllLoaded == offset && offset)
      ) {
        resolve();
        return;
      }

      this.httpLoading = true;
      Collections.get('messages').sourceLoad(
        this.collectionKey,
        { offset: offset, limit: direction * this.numberOfLoadedMessages },
        (messages: Message[]) => {
          this.httpLoading = false;
          this.updateLastFirstMessagesId(messages);
          if (history && messages.length < this.numberOfLoadedMessages) {
            this.firstMessageOfAll = this.firstLoadedMessageId;
          }
          if (!history && messages.length < this.numberOfLoadedMessages) {
            this.lastMessageOfAllLoaded = this.lastLoadedMessageId;
          }
          resolve();
        },
      );
    });
  }

  onNewMessageFromWebsocket(message: Message) {
    const previousMessage: Message = Collections.get('messages').find(this.lastRealtimeMessageId);
    this.lastRealtimeMessageId = Numbers.maxTimeuuid(this.lastRealtimeMessageId, message.id);
    let incrementDifference = 0;
    if (previousMessage && previousMessage.increment_at_time && message.increment_at_time) {
      incrementDifference = message.increment_at_time - previousMessage.increment_at_time;
    }
    console.log(
      'New message: ',
      incrementDifference,
      message.increment_at_time,
      previousMessage && previousMessage.increment_at_time,
    );
    //TODO if we find a newer message not loaded from server,
    // choose to show it and may be reload from server if missing gap
  }

  //Get all loaded messages without holes between messages
  getMessages(): Message[] {
    let messages = Collections.get('messages').findBy({ channel_id: this.channelId });

    const newWebsocketsMessagesToAdd = this.detectNewWebsocketsMessages(messages);

    messages = messages.filter((m: Message) => {
      return (
        Numbers.compareTimeuuid(this.lastLoadedMessageId, m.id) >= 0 &&
        Numbers.compareTimeuuid(this.firstLoadedMessageId, m.id) <= 0
      );
    });

    messages = messages.concat(newWebsocketsMessagesToAdd);

    return messages;
  }

  // We can detect new unknown messages from websocket, this few lines detect new messages
  detectNewWebsocketsMessages(messages: Message[]) {
    let newUnknownMessages: Message[] = [];

    messages.map((m: Message) => {
      if (
        Numbers.compareTimeuuid(this.lastLoadedMessageId, m.id) < 0 &&
        Numbers.compareTimeuuid(this.lastRealtimeMessageId, m.id) < 0
      ) {
        newUnknownMessages.push(m);
      }
    });

    newUnknownMessages.forEach((m: Message) => {
      this.onNewMessageFromWebsocket(m);
    });

    let shouldAddWebsockets =
      newUnknownMessages.length > 0 && this.lastLoadedMessageId === this.lastMessageOfAllLoaded;

    return shouldAddWebsockets ? newUnknownMessages : [];
  }

  reset() {
    this.firstMessageOfAll = '';
    this.firstLoadedMessageId = '';
    this.lastLoadedMessageId = '';
    this.lastMessageOfAllLoaded = '';
    this.lastRealtimeMessageId = '';
  }

  updateLastFirstMessagesId(messages: Message[]) {
    messages.forEach(item => {
      this.lastLoadedMessageId = Numbers.maxTimeuuid(this.lastLoadedMessageId, item.id);
      this.firstLoadedMessageId = Numbers.minTimeuuid(this.firstLoadedMessageId, item.id);
    });
  }

  destroy() {
    Collections.get('messages').removeSource(this.collectionKey);
  }
}
