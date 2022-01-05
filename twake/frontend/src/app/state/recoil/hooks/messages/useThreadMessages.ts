import { NodeMessage } from 'app/models/Message';
import MessageAPIClient from 'app/services/Apps/Messages/clients/MessageAPIClient';
import Numbers from 'app/services/utils/Numbers';
import _ from 'lodash';
import { useRecoilState } from 'recoil';
import { AtomMessageKey, AtomThreadKey, ThreadMessagesState } from '../../atoms/Messages';
import { useSetMessage } from './useMessage';
import {
  AddToWindowOptions,
  getListWindow,
  useAddToWindowedList,
  useRemoveFromWindowedList,
} from './windows';

export const useThreadMessages = (key: AtomThreadKey) => {
  const { window, isInWindow, setLoaded } = getListWindow(key.threadId);
  let [messages, setMessages] = useRecoilState(ThreadMessagesState(key));

  messages = messages.filter(message => isInWindow(message.id || ''));
  messages = messages.sort((a, b) => Numbers.compareTimeuuid(a.sortId, b.sortId));

  const setMessage = useSetMessage(key.companyId);
  const addToThread = useAddMessageToThread(key.companyId);

  const loadMore = async (direction: 'future' | 'history' = 'future') => {
    if (window.reachedStart && direction === 'history') return;

    const limit = 100;
    const newMessages = await MessageAPIClient.list(key.companyId, key.threadId, {
      direction,
      limit,
      pageToken: direction === 'future' ? window.end : window.start,
    });
    setLoaded();

    const nothingNew = newMessages.filter(m => !isInWindow(m.id)).length < limit;

    addToThread(newMessages, {
      threadId: key.threadId,
      inWindow: true,
      ...(nothingNew && direction === 'future' ? { reachedEnd: true } : {}),
      ...(nothingNew && direction !== 'future' ? { reachedStart: true } : {}),
    });

    newMessages.forEach(m => {
      setMessage(m);
    });
  };

  return {
    messages,
    window,
    loadMore,
    jumpTo: () => {},
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
    updater<AtomMessageKey>(
      messages.map(m => {
        return {
          id: m.id,
          threadId: m.thread_id,
          companyId: companyId,
          sortId: m.id,
        };
      }),
      { ...options, windowKey, atom, getId: m => m.id || '' },
    );
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
    remover<AtomMessageKey>(
      messages.map(m => {
        return {
          id: m.id,
          threadId: m.thread_id,
          companyId: companyId,
          sortId: m.id,
        };
      }),
      { atom, getId: m => m.id || '' },
    );
  };
};
