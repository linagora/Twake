import { Message, MessageWithReplies, NodeMessage } from 'app/features/messages/types/message';
import MessageViewAPIClient from 'app/features/messages/api/message-view-api-client';
import LoginService from 'app/features/auth/login-service';
import { useRealtimeRoom } from 'app/features/global/hooks/use-realtime';
import Numbers from 'app/features/global/utils/Numbers';
import _, { some } from 'lodash';
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

export const useChannelMessages = (
  key: AtomChannelKey,
  options?: { onMessages: (msgs: MessageWithReplies[]) => void },
) => {
  const { window, isInWindow, setWindow, getWindow, setLoaded, updateWindowFromIds } =
    getListWindow(key.channelId);
  const [messages, setMessages] = useRecoilState(ChannelMessagesState(key));
  if (messages.length > 0 && !window.loaded) setLoaded(true);

  const setMessage = useSetMessage(key.companyId);
  const addToThread = useAddMessageToThread(key.companyId);

  const addMore = async (
    direction: 'future' | 'history' | 'replace' = 'future',
    newMessages: MessageWithReplies[],
  ) => {
    newMessages?.forEach(m => {
      setMessage(m);
      m.last_replies.forEach(m2 => {
        setMessage(m2);
      });
    });

    newMessages?.forEach(m => {
      addToThread(m.last_replies, {
        threadId: m.thread_id,
        atBottom: true,
        reachedStart: m.last_replies.length >= m.stats.replies,
      });
    });

    let newMessagesKeys = convertToKeys(key.companyId, newMessages);

    let newList = messages;
    if (direction === 'future') {
      newList = [...messages, ...newMessagesKeys];
    }
    if (direction === 'history') {
      newList = [...newMessagesKeys, ...messages];
    }
    if (direction === 'replace') {
      newList = newMessagesKeys;
    }

    setWindow({
      ...updateWindowFromIds(newList.map(message => message.threadId)),
      loaded: true,
      reachedEnd: newMessages.length <= 1 && direction === 'future',
      reachedStart: newMessages.length <= 1 && direction === 'history',
    });

    setMessages(_.uniqBy(newList, 'threadId'));
  };

  const loadMore = async (
    direction: 'future' | 'history' = 'future',
    limit?: number,
    offset?: string,
    options?: { ignoreStateUpdate?: boolean },
  ): Promise<MessageWithReplies[]> => {
    await lock.acquireAsync();
    try {
      const window = getWindow();

      if (window.reachedStart && direction === 'history') {
        lock.release();
        return [];
      }

      if (offset && !isInWindow(offset)) {
        lock.release();
        return [];
      }

      offset = offset !== undefined ? offset : direction === 'future' ? window.end : window.start;
      let messages =
        (await MessageViewAPIClient.feed(key.companyId, key.workspaceId, key.channelId, {
          direction,
          limit,
          pageToken: offset,
        })) || [];

      messages = messages.filter(message => message.thread_id !== offset);

      if (!options?.ignoreStateUpdate) {
        addMore(direction, messages);
      }

      lock.release();
      return messages;
    } catch (err) {
      console.error(err);
      lock.release();
      return [];
    }
  };

  const jumpTo = async (threadId: string) => {
    await lock.acquireAsync();
    setWindow({
      start: threadId,
      end: threadId,
      reachedStart: false,
      reachedEnd: false,
      loaded: false,
    });
    lock.release();
    setMessages([]);
    let newMessages: MessageWithReplies[] = [];
    if (threadId) {
      newMessages = await loadMore('future', 20, threadId, { ignoreStateUpdate: true });
    }
    newMessages = [
      ...(await loadMore('history', 20, threadId, { ignoreStateUpdate: true })),
      ...newMessages,
    ];
    addMore('replace', newMessages);
  };

  useRealtimeRoom<MessageWithReplies>(
    MessageViewAPIClient.feedWebsockets(key.channelId)[0],
    'useChannelMessages',
    async (action: string, event: any) => {
      if (action === 'created' || action === 'updated') {
        const message = event as NodeMessage;
        if (message.ephemeral) return;

        //This will make sure the realtime event doesn't arrive before the server response
        if (event?.user_id === LoginService.currentUserId && action === 'created')
          await new Promise(r => setTimeout(r, 1000));

        if (action === 'created') {
          if (getWindow().reachedEnd) {
            options?.onMessages(await loadMore('future'));
          }
        }

        setMessage(message);
        if (message.thread_id !== message.id) {
          addToThread([message], {
            threadId: message.thread_id,
            atBottom: true,
          });
        }
      }
    },
  );

  return {
    messages,
    window,
    loadMore,
    jumpTo,
    convertToKeys,
  };
};

const convertToKeys = (companyId: string, msgs: MessageWithReplies[] | NodeMessage[]) => {
  return msgs.map(m => {
    const lastReplies = (m as MessageWithReplies).last_replies || [];
    return {
      id: m.id,
      threadId: m.thread_id,
      companyId: companyId,
      sortId: lastReplies[lastReplies.length - 1]?.id || m.thread_id,
    };
  });
};

export const useAddMessageToChannel = (key: AtomChannelKey) => {
  const updater = useAddToWindowedList(key.companyId);
  return (messages: NodeMessage[], options?: AddToWindowOptions) => {
    const windowKey = key.channelId;
    const atom = ChannelMessagesState(key);
    updater<AtomMessageKey>(convertToKeys(key.companyId, messages), {
      ...options,
      windowKey,
      atom,
      getId: m => m.threadId || '',
    });
  };
};

export const useRemoveMessageFromChannel = (key: AtomChannelKey) => {
  const remover = useRemoveFromWindowedList(key.companyId);
  return (messages: NodeMessage[]) => {
    const atom = ChannelMessagesState(key);
    remover<AtomMessageKey>(convertToKeys(key.companyId, messages), {
      atom,
      getId: m => m.threadId || '',
    });
  };
};
