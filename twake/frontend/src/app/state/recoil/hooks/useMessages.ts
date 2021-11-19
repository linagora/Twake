import MessageViewAPIClient from 'app/services/Apps/Messages/clients/MessageViewAPIClient';
import message from 'app/services/Toaster/ToasterService';
import Numbers from 'app/services/utils/Numbers';
import _ from 'lodash';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import {
  AtomChannelKey,
  AtomMessageKey,
  AtomThreadKey,
  ChannelMessagesState,
  MessageState,
  MessagesWindowState,
  setMessage,
  setThreadMessages,
  ThreadMessagesState,
} from '../atoms/Messages';

export const useMessage = (key: AtomMessageKey) => {
  return useRecoilValue(MessageState(key));
};

export const useThreadMessages = (key: AtomThreadKey) => {
  const { window, updateWindowFromIds, isInWindow } = useMessagesWindow(key.threadId);
  const messages = useRecoilValue(ThreadMessagesState(key)).filter(message =>
    isInWindow(message.id),
  );
  updateWindowFromIds(messages.map(m => m.id));
  return {
    messages,
    window,
    loadMore: () => {},
    jumpTo: () => {},
  };
};

//TODO make this more easy to duplicate for other views
export const useChannelMessages = (key: AtomChannelKey) => {
  const { window, updateWindowFromIds, isInWindow } = useMessagesWindow(key.channelId);
  const [messages, setMessages] = useRecoilState(ChannelMessagesState(key));
  const currentWindowMessages = messages.filter(message => isInWindow(message.threadId));
  updateWindowFromIds(currentWindowMessages.map(m => m.threadId));

  return {
    messages: currentWindowMessages,
    window,
    loadMore: async (direction: 'future' | 'history' = 'future') => {
      const newMessages = await MessageViewAPIClient.feed(
        key.companyId,
        key.workspaceId,
        key.channelId,
        { direction, limit: 25, pageToken: direction == 'future' ? window.to : window.from },
      );

      const allMessages = _.uniqBy(
        [
          ...messages,
          ...newMessages.map(m => {
            //TODO Can it be simplified? and also we should update the atom instead of setting default value
            setMessage({ companyId: key.companyId, threadId: m.thread_id, id: m.id }, m);
            if (m.last_replies) {
              setThreadMessages(
                { companyId: key.companyId, threadId: m.id },
                m.last_replies.map(m2 => {
                  return {
                    companyId: key.companyId,
                    threadId: m.id,
                    id: m2.id,
                  };
                }),
              );
              m.last_replies.forEach(m => {
                setMessage({ companyId: key.companyId, threadId: m.id, id: m.id }, m as any);
              });
            }
            //TODO (End of TODO)
            return {
              companyId: key.companyId,
              threadId: m.thread_id,
            };
          }),
        ],
        m => m.threadId,
      );
      updateWindowFromIds(allMessages.map(m => m.threadId));
      setMessages(allMessages);
    },
    jumpTo: () => {},
  };
};

const useMessagesWindow = (key: string) => {
  const [window, setWindow] = useRecoilState(MessagesWindowState(key));
  const updateWindowFromIds = (ids: string[]) => {
    const min = ids.reduce((a, b) => Numbers.minTimeuuid(a, b), ids[0]);
    const max = ids.reduce((a, b) => Numbers.maxTimeuuid(a, b), ids[0]);
    if (max != window.to || min != window.from) {
      setWindow({
        from: min,
        to: max,
      });
    }
  };
  const isInWindow = (id: string) => {
    return (
      (Numbers.compareTimeuuid(id, window.from) >= 0 || !window.from) &&
      (Numbers.compareTimeuuid(id, window.to) <= 0 || !window.to)
    );
  };
  return {
    window,
    updateWindowFromIds,
    isInWindow,
  };
};
