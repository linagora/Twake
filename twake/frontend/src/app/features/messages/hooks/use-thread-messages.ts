import { NodeMessage } from 'app/features/messages/types/message';
import MessageAPIClient from 'app/features/messages/api/message-api-client';
import Numbers from 'app/features/global/utils/Numbers';
import _ from 'lodash';
import { useRecoilState } from 'recoil';
import { AtomMessageKey, AtomThreadKey, ThreadMessagesState } from '../state/atoms/messages';
import { useSetMessage } from './use-message';
import {
  AddToWindowOptions,
  getListWindow,
  useAddToWindowedList,
  useRemoveFromWindowedList,
} from './use-add-to-windowed-list';
import AwaitLock from 'await-lock';

const lock = new AwaitLock();

export const useThreadMessages = (
  key: AtomThreadKey,
  options?: { onMessages: (msgs: NodeMessage[]) => void },
) => {
  const { window, getWindow, isInWindow, setLoaded, setWindow, updateWindowFromIds } =
    getListWindow(key.threadId);
  let [messages, setMessages] = useRecoilState(ThreadMessagesState(key));

  console.log('threadMessages', key, messages);

  if (messages.length > 0 && !window.loaded) setLoaded(true);

  messages = messages.filter(message => isInWindow(message.id || ''));
  messages = messages.sort((a, b) => Numbers.compareTimeuuid(a.sortId, b.sortId));

  const setMessage = useSetMessage(key.companyId);

  const addMore = async (
    direction: 'future' | 'history' | 'replace' = 'future',
    newMessages: NodeMessage[],
  ) => {
    newMessages?.forEach(m => {
      setMessage(m);
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
      ...updateWindowFromIds(newList.map(message => message.id || message.threadId)),
      loaded: true,
      reachedEnd: newMessages.length <= 1 && direction === 'future',
      reachedStart: newMessages.length <= 1 && direction === 'history',
    });

    setMessages(_.uniqBy(newList, 'id'));
  };

  const loadMore = async (
    direction: 'future' | 'history' = 'future',
    limit?: number,
    offset?: string,
    options?: { ignoreStateUpdate?: boolean },
  ) => {
    console.log('loadMoreloadMore', direction, limit, offset);

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

      limit = limit || 50;
      const newMessages = await MessageAPIClient.list(key.companyId, key.threadId, {
        direction,
        limit,
        pageToken: direction === 'future' ? window.end : window.start,
      });
      setLoaded();

      addMore(direction, newMessages);

      if (!options?.ignoreStateUpdate) {
        addMore(direction, newMessages);
      }

      lock.release();
      return newMessages;
    } catch (err) {
      console.error(err);
      lock.release();
      return [];
    }
  };

  const jumpTo = async (id: string) => {
    await lock.acquireAsync();
    setWindow({
      start: id,
      end: id,
      reachedStart: false,
      reachedEnd: false,
      loaded: false,
    });
    lock.release();
    setMessages([]);
    let newMessages: NodeMessage[] = [];
    if (id) {
      newMessages = await loadMore('future', 20, id, { ignoreStateUpdate: true });
    }
    newMessages = [
      ...(await loadMore('history', 20, id, { ignoreStateUpdate: true })),
      ...newMessages,
    ];
    addMore('replace', newMessages);
  };

  return {
    messages,
    window,
    loadMore,
    jumpTo,
    convertToKeys,
  };
};

export const useAddMessageToThread = (companyId: string) => {
  const updater = useAddToWindowedList(companyId);
  return (messages: NodeMessage[], options: AddToWindowOptions & { threadId: string }) => {
    messages = messages.filter(m => m.id !== m.thread_id);
    const threadId = options?.threadId;
    const windowKey = threadId;
    const atom = ThreadMessagesState({
      threadId,
      companyId: companyId,
    });
    updater<AtomMessageKey>(convertToKeys(companyId, messages), {
      ...options,
      windowKey,
      atom,
      getId: m => m.id || '',
    });
  };
};

export const useRemoveMessageFromThread = (companyId: string) => {
  const remover = useRemoveFromWindowedList(companyId);
  return (messages: NodeMessage[], options: { threadId: string }) => {
    if (messages.length === 0) return;
    const threadId = options.threadId;
    const atom = ThreadMessagesState({
      threadId,
      companyId: companyId,
    });
    remover<AtomMessageKey>(convertToKeys(companyId, messages), { atom, getId: m => m.id || '' });
  };
};

const convertToKeys = (companyId: string, msgs: NodeMessage[]) => {
  return msgs.map(m => {
    return {
      id: m.id,
      threadId: m.thread_id,
      companyId: companyId,
      sortId: m.id,
    };
  });
};
