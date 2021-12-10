import { NodeMessage } from 'app/models/Message';
import _ from 'lodash';
import { useRecoilState } from 'recoil';
import { AtomMessageKey, AtomThreadKey, ThreadMessagesState } from '../../atoms/Messages';
import {
  AddToWindowOptions,
  getListWindow,
  useAddToWindowedList,
  useRemoveFromWindowedList,
} from './windows';

//TODO this also could jump, do we need windows too ?
export const useThreadMessages = (key: AtomThreadKey) => {
  const { window, updateWindowFromIds, isInWindow } = getListWindow(key.threadId);
  let [messages, setMessages] = useRecoilState(ThreadMessagesState(key));

  console.log('reachedEnd? part1', messages);

  messages = messages.filter(message => isInWindow(message.id || ''));

  console.log('reachedEnd? part2', messages);

  return {
    messages,
    window,
    loadMore: () => {},
    jumpTo: () => {},
  };
};

export const useAddMessageToThread = (companyId: string) => {
  const updater = useAddToWindowedList(companyId);
  return (messages: NodeMessage[], options?: AddToWindowOptions) => {
    if (messages.length === 0) return;
    const threadId = messages[0].thread_id;
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
        };
      }),
      { ...options, windowKey, atom, getId: m => m.id || '' },
    );
  };
};

export const useRemoveMessageFromThread = (companyId: string) => {
  const remover = useRemoveFromWindowedList(companyId);
  return (messages: NodeMessage[]) => {
    if (messages.length === 0) return;
    const threadId = messages[0].thread_id;
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
        };
      }),
      { atom, getId: m => m.id || '' },
    );
  };
};
