import { MessageWithReplies } from 'app/models/Message';
import MessageViewAPIClient from 'app/services/Apps/Messages/clients/MessageViewAPIClient';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import message from 'app/services/Toaster/ToasterService';
import Numbers from 'app/services/utils/Numbers';
import _ from 'lodash';
import { useEffect } from 'react';
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
  const [messages, setMessages] = useRecoilState(ChannelMessagesState(key));
  const { window, updateWindowFromIds, isInWindow, reachEdge } = useMessagesWindow(key.channelId);
  const currentWindowMessages = messages.filter(message => isInWindow(message.threadId));

  const loadMore = async (direction: 'future' | 'history' = 'future') => {
    if (window.reachedEnd && direction === 'future') {
      return;
    }
    if (window.reachedStart && direction === 'history') {
      return;
    }

    const limit = 25;
    const newMessages = await MessageViewAPIClient.feed(
      key.companyId,
      key.workspaceId,
      key.channelId,
      { direction, limit, pageToken: direction === 'future' ? window.end : window.start },
    );

    if (direction === 'future') {
      reachEdge({ reachedEnd: newMessages.length <= 1 });
    } else {
      reachEdge({ reachedStart: newMessages.length <= 1 });
    }

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

    allMessages.sort((a, b) => Numbers.compareTimeuuid(a.threadId, b.threadId));

    updateWindowFromIds(allMessages.map(m => m.threadId));
    setMessages(allMessages);
  };

  const test = (action: any, resource: any) => {
    console.log('window in useRealtimeRoom', action, window);
    loadMore('future');
  };

  useRealtimeRoom<MessageWithReplies>(
    //TODO should get this from backend not hardcoded here
    `/companies/${key.companyId}/workspaces/${key.workspaceId}/channels/${key.channelId}/feed`,
    'useChannelMessages',
    test,
  );

  return {
    messages: currentWindowMessages,
    window,
    loadMore,
    jumpTo: () => {},
  };
};

const useMessagesWindow = (key: string) => {
  const [window, setWindow] = useRecoilState(MessagesWindowState(key));
  const updateWindowFromIds = (ids: string[]) => {
    const min = ids.reduce((a, b) => Numbers.minTimeuuid(a, b), ids[0]);
    const max = ids.reduce((a, b) => Numbers.maxTimeuuid(a, b), ids[0]);
    console.log(ids, min, max);
    if (max !== window.end || min !== window.start) {
      setWindow({
        ...window,
        start: min,
        end: max,
      });
    }
  };
  const reachEdge = (status: { reachedStart?: boolean; reachedEnd?: boolean }) => {
    console.log('reachEdge', { ...window, ...status });
    setWindow({
      ...window,
      ...status,
    });
  };
  const isInWindow = (id: string) => {
    return (
      (Numbers.compareTimeuuid(id, window.start) >= 0 || !window.start) &&
      (Numbers.compareTimeuuid(id, window.end) <= 0 || !window.end)
    );
  };
  return {
    window,
    updateWindowFromIds,
    reachEdge,
    isInWindow,
  };
};
