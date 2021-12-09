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
import { useAddToThread } from './useThreadMessages';
import { messageToMessageWithReplies, useMessagesWindow } from './utils';

//TODO make this more easy to duplicate for other views
export const useChannelMessages = (key: AtomChannelKey) => {
  const [messages, setMessages] = useRecoilState(ChannelMessagesState(key));
  const { window, updateWindowFromIds, isInWindow, reachEdge } = useMessagesWindow(key.channelId);
  const currentWindowedMessages = messages.filter(message => isInWindow(message.threadId));

  const setMessage = useSetMessage(key.companyId);
  const addToThread = useAddToThread(key.companyId);

  const loadMore = async (direction: 'future' | 'history' = 'future') => {
    if (window.reachedEnd && direction === 'future') {
      return;
    }
    if (window.reachedStart && direction === 'history') {
      return;
    }

    const limit = 100;
    const newMessages = await MessageViewAPIClient.feed(
      key.companyId,
      key.workspaceId,
      key.channelId,
      { direction, limit, pageToken: direction === 'future' ? window.end : window.start },
    );

    if (direction === 'future') {
      reachEdge({ reachedEnd: newMessages.filter(m => !isInWindow(m.thread_id)).length <= 1 });
    } else {
      reachEdge({ reachedStart: newMessages.filter(m => !isInWindow(m.thread_id)).length <= 1 });
    }

    const allMessages = _.uniqBy(
      [
        ...messages,
        ...newMessages.map(m => {
          updateRecoilFromMessage(key, m, setMessage, addToThread);
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
    MessageViewAPIClient.feedWebsockets(key.channelId)[0],
    'useChannelMessages',
    (action: string, event: any) => {
      console.log('receive event', action, event);
      if (action === 'created' || action === 'updated') {
        updateRecoilFromMessage(key, event as NodeMessage, setMessage, addToThread);
        addToThread([event as NodeMessage]);

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
    messages: currentWindowedMessages,
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
  setMessage: Function,
  addToThread: Function,
) => {
  if ((m as MessageWithReplies)?.last_replies?.length === undefined) {
    m = messageToMessageWithReplies(m);
  }

  const mwr = _.cloneDeep(m) as MessageWithReplies;
  mwr.last_replies = mwr.last_replies.filter(m => m.id !== m.thread_id);

  setMessage(mwr);
  if (mwr.last_replies) {
    addToThread(mwr.last_replies);
    mwr.last_replies.forEach(m => {
      setMessage(m);
    });
  }
};
