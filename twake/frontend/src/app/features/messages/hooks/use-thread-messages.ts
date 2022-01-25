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
