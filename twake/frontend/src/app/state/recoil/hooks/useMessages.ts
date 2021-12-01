import { MessageWithReplies, NodeMessage } from 'app/models/Message';
import MessageViewAPIClient from 'app/services/Apps/Messages/clients/MessageViewAPIClient';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import Numbers from 'app/services/utils/Numbers';
import _ from 'lodash';
import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import {
  AtomChannelKey,
  AtomThreadKey,
  ChannelMessagesState,
  ChannelMessagesStateExtended,
  MessageStateExtended,
  MessagesWindowState,
  ThreadMessagesState,
  ThreadMessagesStateExtended,
} from '../atoms/Messages';

//TODO this also could jump, do we need windows too ?
export const useThreadMessages = (key: AtomThreadKey) => {
  const { window, updateWindowFromIds, isInWindow } = useMessagesWindow(key.threadId);
  let [messages, setMessages] = useRecoilState(ThreadMessagesState(key));
  useEffect(() => {
    ThreadMessagesStateExtended.setHandler(key.threadId, setMessages, messages);
  }, [key.threadId, messages, setMessages]);

  messages = messages.filter(message => isInWindow(message.id || ''));
  updateWindowFromIds(messages.map(m => m.id || ''));
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
  useEffect(() => {
    ChannelMessagesStateExtended.setHandler(key.channelId, setMessages, messages);
  }, [key.channelId, messages, setMessages]);

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
          updateRecoilFromMessage(key, m);
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

  const { send } = useRealtimeRoom<MessageWithReplies>(
    //TODO should get this from backend not hardcoded here and add the token
    `/companies/${key.companyId}/workspaces/${key.workspaceId}/channels/${key.channelId}/feed`,
    '',
    'useChannelMessages',
    (action: string, event: any) => {
      console.log('receive event', action, event);
      if (action === 'created' || action === 'updated') {
        updateRecoilFromMessage(key, event as NodeMessage);

        //TODO make this more clean
        let threadMessages = ThreadMessagesStateExtended.get(event.thread_id) || [];
        console.log(threadMessages);
        threadMessages = _.uniqBy(
          [
            ...threadMessages,
            {
              companyId: key.companyId,
              threadId: (event as NodeMessage).thread_id,
              id: (event as NodeMessage).id,
            },
          ],
          m => m.id,
        );
        console.log(threadMessages);
        ThreadMessagesStateExtended.set(event.thread_id, threadMessages);

        //TODO make this more clean
        const allMessages = _.uniqBy(
          [
            ...messages,
            {
              companyId: key.companyId,
              threadId: (event as NodeMessage).thread_id,
            },
          ],
          m => m.threadId,
        );
        allMessages.sort((a, b) => Numbers.compareTimeuuid(a.threadId, b.threadId));
        updateWindowFromIds(allMessages.map(m => m.threadId));
        setMessages(allMessages);
      }
    },
  );

  return {
    messages: currentWindowMessages,
    window,
    loadMore,
    send,
    jumpTo: () => {},
  };
};

/**
 * This will set all the messages and threads atoms records from any kind of list
 */
const updateRecoilFromMessage = (
  key: { companyId: string },
  m: MessageWithReplies | NodeMessage,
) => {
  if ((m as MessageWithReplies)?.last_replies?.length === undefined) {
    m = messageToMessageWithReplies(m);
  }

  const mwr = _.cloneDeep(m) as MessageWithReplies;
  mwr.last_replies = mwr.last_replies.filter(m => m.id !== m.thread_id);

  MessageStateExtended.set(mwr.id, mwr);
  if (mwr.last_replies) {
    ThreadMessagesStateExtended.set(
      mwr.id,
      _.uniqBy(
        [
          ...(ThreadMessagesStateExtended.get(mwr.id) || []),
          ...mwr.last_replies.map(m => {
            return {
              companyId: key.companyId,
              threadId: mwr.id,
              id: m.id,
            };
          }),
        ],
        m => m.id,
      ).filter(m => m.id !== m.threadId),
    );
    mwr.last_replies.forEach(m => {
      MessageStateExtended.set(m.id, messageToMessageWithReplies(m));
    });
  }
};

/**
 * This convert a NodeMessage to a MessageWithReply type to make things easier
 */
export const messageToMessageWithReplies = (m: NodeMessage | MessageWithReplies) => {
  const mwr: MessageWithReplies = {
    ...m,
    last_replies:
      (m as MessageWithReplies)?.last_replies || MessageStateExtended.get(m.id)?.last_replies || [],
    stats: (m as MessageWithReplies)?.stats ||
      MessageStateExtended.get(m.id)?.stats || { last_activity: m.created_at, replies: 0 },
  };
  return mwr;
};

/**
 * This is the hook to work with feed window (from where to where we are looking to messages)
 * useful mostly in case of jumps
 */
const useMessagesWindow = (key: string) => {
  const [window, setWindow] = useRecoilState(MessagesWindowState(key));
  const updateWindowFromIds = (ids: string[]) => {
    const min = ids.reduce((a, b) => Numbers.minTimeuuid(a, b), ids[0]);
    const max = ids.reduce((a, b) => Numbers.maxTimeuuid(a, b), ids[0]);
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
