import { MessageWithReplies, NodeMessage } from 'app/models/Message';
import MessageViewAPIClient from 'app/services/Apps/Messages/clients/MessageViewAPIClient';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import Numbers from 'app/services/utils/Numbers';
import _ from 'lodash';
import { useRecoilCallback, useRecoilState } from 'recoil';
import {
  AtomChannelKey,
  AtomThreadKey,
  ChannelMessagesState,
  MessageState,
  MessagesWindowState,
  ThreadMessagesState,
} from '../../atoms/Messages';
import { useSetMessage } from './useMessage';
import { useMessagesWindow } from './utils';

//TODO this also could jump, do we need windows too ?
export const useThreadMessages = (key: AtomThreadKey) => {
  const { window, updateWindowFromIds, isInWindow } = useMessagesWindow(key.threadId);
  let [messages, setMessages] = useRecoilState(ThreadMessagesState(key));

  console.log('useThreadMessages', messages);

  messages = messages.filter(message => isInWindow(message.id || ''));
  updateWindowFromIds(messages.map(m => m.id || ''));
  return {
    messages,
    window,
    loadMore: () => {},
    jumpTo: () => {},
  };
};

export const useAddToThread = (companyId: string) => {
  return useRecoilCallback(
    ({ set, snapshot }) =>
      async (messages: NodeMessage[], atBottom: boolean = true) => {
        if (messages.length === 0) return;

        const threadId = messages[0].thread_id;
        const { window, updateWindowFromIds } = useMessagesWindow(threadId);

        //If message is new and should be added at bottom,
        // we only update window if window is currently at the end
        if (atBottom && window.reachedEnd) {
          updateWindowFromIds([window.start, ...messages.map(m => m.id)]);
        }

        //We update the thread atom
        const atom = ThreadMessagesState({
          threadId,
          companyId: companyId,
        });
        set(
          atom,
          _.uniqBy(
            [
              ...(await snapshot.getPromise(atom)),
              ...messages.map(m => {
                return { id: m.id, threadId: m.thread_id, companyId: companyId };
              }),
            ],
            m => m.id,
          ),
        );
      },
    [companyId],
  );
};
