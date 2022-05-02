import { MessageWithReplies, NodeMessage } from 'app/features/messages/types/message';
import MessageViewAPIClient from 'app/features/messages/api/message-view-api-client';
import LoginService from 'app/features/auth/login-service';
import { useRealtimeRoom } from 'app/features/global/hooks/use-realtime';
import Numbers from 'app/features/global/utils/Numbers';
import _ from 'lodash';
import { useRecoilState } from 'recoil';
import { AtomChannelKey, AtomMessageKey, ChannelMessagesState } from '../state/atoms/messages';
import { useSetMessage } from './use-message';
import { useAddMessageToThread } from './use-thread-messages';
import { messageToMessageWithReplies } from '../utils/message-with-replies';
import {
  getListWindow,
  AddToWindowOptions,
  useAddToWindowedList,
  useRemoveFromWindowedList,
} from './use-add-to-windowed-list';
import AwaitLock from 'await-lock';

const lock = new AwaitLock();

//TODO make this more easy to duplicate for other views
export const useChannelMessages = (key: AtomChannelKey) => {
  const [messages, setMessages] = useRecoilState(ChannelMessagesState(key));
  const { window, isInWindow, setLoaded, setWindow, getWindow } = getListWindow(key.channelId);
  let currentWindowedMessages = messages.filter(message => isInWindow(message.threadId));
  currentWindowedMessages = currentWindowedMessages.sort((a, b) =>
    Numbers.compareTimeuuid(a.sortId, b.sortId),
  );

  const setMessage = useSetMessage(key.companyId);
  const addToThread = useAddMessageToThread(key.companyId);
  const addToChannel = useAddMessageToChannel(key);

  const loadMore = async (
    direction: 'future' | 'history' = 'future',
    limit?: number,
    offset?: string,
  ): Promise<any[]> => {
    let newMessages: MessageWithReplies[] | undefined = [];
    await lock.acquireAsync();
    try {
      const window = _.cloneDeep(getWindow());

      if (window.reachedStart && direction === 'history') return [];

      console.log('vir window', direction, limit, offset, window);

      limit = limit || 20;
      newMessages = await MessageViewAPIClient.feed(key.companyId, key.workspaceId, key.channelId, {
        direction,
        limit,
        pageToken: offset || (direction === 'future' ? window.end : window.start),
      });
      setLoaded();

      if (window.end !== getWindow().end || window.start !== getWindow().start) {
        console.log(
          'vir wind cancelled: ',
          window.end,
          getWindow().end,
          window.start,
          getWindow().start,
        );
        //Something changed, we cancel the request
        lock.release();
        return [];
      }

      const nothingNew =
        (newMessages?.filter(m => !isInWindow(m.thread_id)).length || 0) <= 1 &&
        !!window.start &&
        !!window.end;

      newMessages?.forEach(m => {
        setMessage(m);
        m.last_replies.forEach(m2 => {
          setMessage(m2);
        });
      });

      addToChannel(newMessages || [], {
        inWindow: true,
        ...(nothingNew && direction === 'future' ? { reachedEnd: true } : {}),
        ...(nothingNew && direction !== 'future' ? { reachedStart: true } : {}),
      });

      newMessages?.forEach(m => {
        addToThread(m.last_replies, {
          threadId: m.thread_id,
          atBottom: true,
          reachedStart: m.last_replies.length >= m.stats.replies,
        });
      });
    } finally {
      await new Promise(r =>
        setTimeout(() => {
          console.log('vir wind released', getWindow());
          lock.release();
          r(true);
        }, 500),
      );
    }
    return (newMessages || [])?.map(m => {
      const lastReplies = (m as MessageWithReplies).last_replies || [];
      return {
        id: m.id,
        threadId: m.thread_id,
        companyId: key.companyId,
        sortId: lastReplies[lastReplies.length - 1]?.id || m.thread_id,
      };
    });
  };

  useRealtimeRoom<MessageWithReplies>(
    MessageViewAPIClient.feedWebsockets(key.channelId)[0],
    'useChannelMessages',
    async (action: string, event: any) => {
      if (action === 'created' || action === 'updated') {
        const message = event as NodeMessage;
        if (message.ephemeral) {
          console.log('received ephemeral !');
          return;
        }
      }

      //This will make sure the realtime event doesn't arrive before the server response
      if (event?.user_id === LoginService.currentUserId && action === 'created') {
        await new Promise(r => setTimeout(r, 1000));
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
            threadId: message.thread_id,
            atBottom: true,
          });
        }
      }
    },
  );

  const jumpTo = async (threadId: string) => {
    await lock.acquireAsync();
    setWindow({
      start: threadId,
      end: threadId,
      reachedStart: false,
      reachedEnd: false,
      loaded: false,
    });
    setMessages([]);
    lock.release();
    await loadMore('future');
    await loadMore('history');
  };

  return {
    messages: currentWindowedMessages,
    window,
    loadMore,
    jumpTo,
  };
};

export const useAddMessageToChannel = (key: AtomChannelKey) => {
  const updater = useAddToWindowedList(key.companyId);
  return (messages: NodeMessage[], options?: AddToWindowOptions) => {
    const windowKey = key.channelId;
    const atom = ChannelMessagesState(key);
    updater<AtomMessageKey>(
      messages?.map(m => {
        const lastReplies = (m as MessageWithReplies).last_replies || [];
        return {
          id: m.id,
          threadId: m.thread_id,
          companyId: key.companyId,
          sortId: lastReplies[lastReplies.length - 1]?.id || m.thread_id,
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
        const lastReplies = (m as MessageWithReplies).last_replies || [];
        return {
          id: m.id,
          threadId: m.thread_id,
          companyId: key.companyId,
          sortId: lastReplies[lastReplies.length - 1]?.id || m.thread_id,
        };
      }),
      { atom, getId: m => m.threadId || '' },
    );
  };
};
