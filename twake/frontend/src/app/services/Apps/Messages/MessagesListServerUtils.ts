import Collections from 'services/Collections/Collections.js';
import Numbers from 'services/utils/Numbers.js';
import Observable from 'services/observable';

export type Message = {
  application_id?: string | null;
  channel_id?: string;
  content?: any;
  creation_date?: number;
  edited?: boolean;
  front_id?: string;
  hidden_data?: any;
  id?: string;
  increment_at_time?: number | null;
  message_type?: 0 | 1 | 2;
  modification_date?: number;
  parent_message_id?: string | null;
  pinned?: boolean;
  reactions?: any;
  responses_count?: number | null;
  sender?: string | null;
  user_specific_content?: any;
  _user_ephemeral?: any;
  _last_modified?: string;
  _user_reaction?: any;
};

class MessagesListServerUtilsManager {
  services: { [key: string]: MessagesListServerUtils } = {};
  constructor() {}
  get(channelId: string, threadId: string, collectionKey: string) {
    const key = channelId + '_' + collectionKey;
    if (this.services[key]) {
      //@ts-ignore
      window.MessagesListServerUtils = this.services[key];
      return this.services[key];
    }
    this.services[key] = new MessagesListServerUtils(channelId, threadId, collectionKey);
    return this.services[key];
  }
}

export default new MessagesListServerUtilsManager();

/*
  This class will manage what is loaded from the backend and what's not, the complete list of messages for a channel will always be h
*/
export class MessagesListServerUtils extends Observable {
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
  lastRealtimeMessageId: string = '';
  didInit: boolean = false;
  destroyed: boolean = false;

  httpLoading: boolean = false;

  constructor(channelId: string, threadId: string, collectionKey: string) {
    super();

    this.channelId = channelId;
    this.threadId = threadId;
    this.collectionKey = collectionKey;

    this.onNewMessageFromWebsocketListener = this.onNewMessageFromWebsocketListener.bind(this);
  }

  //Init messages and reset almost everything.
  // Option 1: no parameters or true = init at the end of the conversation
  // Option 2: from parameters = init next to a defined message
  async init(fromMessageId: string | boolean = false) {
    Collections.get('messages').addListener(this.onNewMessageFromWebsocketListener);

    if (this.httpLoading) {
      return;
    }

    if (!this.destroyed && this.didInit && fromMessageId) {
      this.reset();
      if (typeof fromMessageId === 'string') {
        return this.loadMore(false, fromMessageId);
      } else {
        return this.loadMore(true, '');
      }
    } else {
      return new Promise(resolve => {
        if (!this.didInit) {
          this.httpLoading = true;
        }
        if (this.destroyed) {
          this.destroyed = false;
          resolve();
        }
        Collections.get('messages').addSource(
          {
            http_base_url: 'discussion',
            http_options: {
              channel_id: this.channelId,
              parent_message_id: this.threadId,
              limit: 20,
              offset: false,
            },
            websockets: [{ uri: 'messages/' + this.channelId, options: { type: 'messages' } }],
          },
          this.collectionKey,
          (messages: Message[]) => {
            this.reset();
            this.httpLoading = false;
            this.updateLastFirstMessagesId(messages, true);
            if (!fromMessageId || fromMessageId === true) {
              this.lastMessageOfAllLoaded = this.lastLoadedMessageId;
            }

            if (messages[0]?.hidden_data?.type === 'init_channel' || messages.length < 20) {
              this.firstMessageOfAll = Numbers.minTimeuuid(
                this.firstLoadedMessageId,
                this.firstMessageOfAll,
              );
            }
            this.notify();
            this.didInit = true;

            if (fromMessageId && fromMessageId !== true) {
              this.init(fromMessageId).then(() => {
                resolve();
              });
            } else {
              resolve();
            }
          },
        );
      }).then(() => {
        //After an init always update last and first messages
        this.onNewMessageFromWebsocketListener(null);
        return new Promise(resolve => resolve());
      });
    }
  }

  //Load more messages, fromOffset can be undefined (use class variables), or a string, or an empty string (load from the end / the begining)
  async loadMore(history: boolean = true, fromOffset?: string) {
    return new Promise(resolve => {
      if (this.httpLoading) {
        resolve(false);
        return;
      }

      const direction = history ? 1 : -1;
      const offset =
        typeof fromOffset === 'string'
          ? fromOffset
          : history
          ? this.firstLoadedMessageId
          : this.lastLoadedMessageId;

      if (
        (history && this.firstMessageOfAll == offset && offset) ||
        (!history && this.lastMessageOfAllLoaded == offset && offset)
      ) {
        resolve(false);
        return;
      }

      this.httpLoading = true;
      Collections.get('messages').sourceLoad(
        this.collectionKey,
        {
          offset: offset,
          limit: direction * this.numberOfLoadedMessages,
        },
        (messages: Message[]) => {
          this.httpLoading = false;
          this.updateLastFirstMessagesId(messages, !!fromOffset);
          if (history && messages.length < this.numberOfLoadedMessages) {
            this.firstMessageOfAll = this.firstLoadedMessageId;
          }
          if (!history && messages.length < this.numberOfLoadedMessages) {
            this.lastMessageOfAllLoaded = this.lastLoadedMessageId;
          }
          this.notify();
          resolve(true);
        },
      );
    });
  }

  //Get all loaded messages without holes between messages
  getMessages(): Message[] {
    if (this.lastLoadedMessageId === this.firstLoadedMessageId && this.httpLoading) {
      return [];
    }

    const filter: any = {
      channel_id: this.channelId,
    };
    if (this.threadId) {
      filter.parent_message_id = this.threadId;
    }
    let messages = Collections.get('messages').findBy(filter);

    this.detectNewWebsocketsMessages(messages);

    messages = messages
      .filter((m: Message) => {
        return (
          Numbers.compareTimeuuid(this.lastLoadedMessageId, m.id) >= 0 &&
          Numbers.compareTimeuuid(this.firstLoadedMessageId, m.id) <= 0
        );
      })
      .filter((message: Message) => !message._user_ephemeral)
      .sort((a: Message, b: Message) => (a?.creation_date || 0) - (b?.creation_date || 0));

    if (!this.threadId) {
      let lastParentId: string = '';
      messages = messages.filter((m: Message) => {
        if (m.parent_message_id) {
          if (
            lastParentId &&
            lastParentId != m.parent_message_id &&
            Numbers.compareTimeuuid(m.parent_message_id, m.id) <= 0
          ) {
            return true;
          }
          return false;
        } else {
          lastParentId = m.id || '';
        }
        return true;
      });
    }

    return messages;
  }

  hasFirstMessage(): boolean {
    return this.firstLoadedMessageId === this.firstMessageOfAll;
  }

  hasLastMessage(): boolean {
    return !!this.lastMessageOfAllLoaded;
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

    return newUnknownMessages;
  }

  onNewMessageFromWebsocketListener(_event: any) {
    this.detectNewWebsocketsMessages(
      Collections.get('messages').findBy({
        channel_id: this.channelId,
      }),
    );
    this.notify();
  }

  onNewMessageFromWebsocket(message: Message) {
    //TODO if we find a newer message not loaded from server,
    // choose to show it and may be reload from server if missing gap

    //For now just consider we always receive everything from websockets
    if (this.lastLoadedMessageId === this.lastMessageOfAllLoaded) {
      this.updateLastFirstMessagesId([message]);
    }
  }

  reset() {
    this.firstMessageOfAll = '';
    this.firstLoadedMessageId = '';
    this.lastLoadedMessageId = '';
    this.lastMessageOfAllLoaded = '';
    this.lastRealtimeMessageId = '';
  }

  updateLastFirstMessagesId(messages: Message[], reset?: boolean) {
    if (reset) {
      this.reset();
    }

    const wasAtEnd = this.hasLastMessage();

    this.lastLoadedMessageId = Numbers.maxTimeuuid(
      this.lastLoadedMessageId,
      '00000000-0000-1000-0000-000000000000',
    );
    messages.forEach(item => {
      this.lastLoadedMessageId = Numbers.maxTimeuuid(this.lastLoadedMessageId, item.id);
      this.firstLoadedMessageId = Numbers.minTimeuuid(this.firstLoadedMessageId, item.id);
    });

    if (wasAtEnd) {
      this.lastMessageOfAllLoaded = Numbers.maxTimeuuid(
        this.lastMessageOfAllLoaded,
        this.lastLoadedMessageId,
      );
    }
  }

  destroy() {
    this.destroyed = true;
    this.httpLoading = false;
    Collections.get('messages').removeSource(this.collectionKey);
    Collections.get('messages').removeListener(this.onNewMessageFromWebsocketListener);
  }
}
