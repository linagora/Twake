import { MessageWithReplies, NodeMessage } from 'app/models/Message';
import MessageViewAPIClient from 'app/services/Apps/Messages/clients/MessageViewAPIClient';
import LoginService from 'app/services/login/LoginService';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import Numbers from 'app/services/utils/Numbers';
import _ from 'lodash';
import { useRecoilState } from 'recoil';
import { AtomChannelKey, AtomMessageKey, ChannelMessagesState } from '../../atoms/Messages';
import { useSetMessage } from './useMessage';
import { useAddMessageToThread } from './useThreadMessages';
import { messageToMessageWithReplies } from './utils';
import {
  getListWindow,
  AddToWindowOptions,
  useAddToWindowedList,
  useRemoveFromWindowedList,
} from './windows';

//TODO make this more easy to duplicate for other views
export const useChannelMessages = (key: AtomChannelKey) => {
  const [messages, setMessages] = useRecoilState(ChannelMessagesState(key));
  const { window, isInWindow } = getListWindow(key.channelId);
  const currentWindowedMessages = messages.filter(message => isInWindow(message.threadId));

  const setMessage = useSetMessage(key.companyId);
  const addToThread = useAddMessageToThread(key.companyId);
  const addToChannel = useAddMessageToChannel(key);

  const loadMore = async (direction: 'future' | 'history' = 'future') => {
    if (window.reachedEnd && direction === 'future') return;
    if (window.reachedStart && direction === 'history') return;

    const limit = 100;
    const newMessages = await MessageViewAPIClient.feed(
      key.companyId,
      key.workspaceId,
      key.channelId,
      { direction, limit, pageToken: direction === 'future' ? window.end : window.start },
    );

    const nothingNew = newMessages.filter(m => !isInWindow(m.thread_id)).length <= 1;

    addToChannel(newMessages, {
      inWindow: true,
      ...(nothingNew && direction === 'future' ? { reachedEnd: true } : {}),
      ...(nothingNew && direction !== 'future' ? { reachedStart: true } : {}),
    });

    newMessages.forEach(m => {
      setMessage(m);
      addToThread(m.last_replies, { atBottom: true });
      m.last_replies.forEach(m2 => {
        setMessage(m2);
      });
    });
  };

  const { send } = useRealtimeRoom<MessageWithReplies>(
    MessageViewAPIClient.feedWebsockets(key.channelId)[0],
    'useChannelMessages',
    async (action: string, event: any) => {
      console.log(action, event);

      //This will make sure the realtime event doesn't arrive before the server response
      if (event?.user_id === LoginService.currentUserId) {
        await new Promise(r => setTimeout(r, 500));
      }

      if (action === 'created' || action === 'updated') {
        const message = event as NodeMessage;
        setMessage(message);
        if (message.thread_id === message.id) {
          addToChannel([message], {
            atBottom: true,
          });
        } else {
          addToThread([message], {
            atBottom: true,
          });
        }
      }
    },
  );

  return {
    messages: currentWindowedMessages,
    window,
    loadMore,
    send: () => {},
    jumpTo: () => {},
  };
};

/**
 * This will set all the messages and threads atoms records from any kind of list
 */
const updateRecoilFromMessage = (
  key: { companyId: string },
  m: MessageWithReplies | NodeMessage,
  setMessage: Function,
  addToThread: Function,
) => {
  if ((m as MessageWithReplies)?.last_replies?.length === undefined) {
    m = messageToMessageWithReplies(m);
  }

  const mwr = _.cloneDeep(m) as MessageWithReplies;
  mwr.last_replies = mwr.last_replies.filter(m => m.id !== m.thread_id);

  setMessage(mwr);
  if (mwr.last_replies) {
    addToThread(mwr.last_replies, { atBottom: true });
    mwr.last_replies.forEach(m => {
      setMessage(m);
    });
  }
};

export const useAddMessageToChannel = (key: AtomChannelKey) => {
  const updater = useAddToWindowedList(key.companyId);
  return (messages: NodeMessage[], options?: AddToWindowOptions) => {
    const windowKey = key.channelId;
    const atom = ChannelMessagesState(key);
    updater<AtomMessageKey>(
      messages.map(m => {
        return {
          id: m.id,
          threadId: m.thread_id,
          companyId: key.companyId,
        };
      }),
      { ...options, windowKey, atom, getId: m => m.threadId || '' },
    );
  };
};

export const useRemoveMessageFromChannel = (key: AtomChannelKey) => {
  const remover = useRemoveFromWindowedList(key.companyId);
  return (messages: NodeMessage[]) => {
    const atom = ChannelMessagesState(key);
    remover<AtomMessageKey>(
      messages.map(m => {
        return {
          id: m.id,
          threadId: m.thread_id,
          companyId: key.companyId,
        };
      }),
      { atom, getId: m => m.threadId || '' },
    );
  };
};
