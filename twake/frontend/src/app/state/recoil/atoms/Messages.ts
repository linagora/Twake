import { MessageWithReplies, NodeMessage } from 'app/models/Message';
import MessageAPIClient from 'app/services/Apps/Messages/clients/MessageAPIClient';
import MessageViewAPIClient from 'app/services/Apps/Messages/clients/MessageViewAPIClient';
import { atomFamily } from 'recoil';

export type AtomMessageKey = { companyId: string; threadId: string; id: string };

export type AtomThreadKey = { companyId: string; threadId: string };

export type AtomChannelKey = { companyId: string; workspaceId: string; channelId: string };

export type AtomThreadValue = AtomThreadKey & {};

export const MessageState = atomFamily<MessageWithReplies, AtomMessageKey>({
  key: 'MessageState',
  default: ({ companyId, threadId, id }) => {
    return MessageAPIClient.get(companyId, threadId, id);
  },
});

export const ThreadMessagesState = atomFamily<AtomMessageKey[], AtomThreadKey>({
  key: 'ThreadMessagesState',
  default: async ({ companyId, threadId }) => {
    const messages = await MessageAPIClient.list(companyId, threadId);
    return messages.map(m => {
      //Update message atoms states

      return {
        companyId: companyId,
        threadId: m.thread_id,
        id: m.id,
      };
    });
  },
});

export const ChannelMessagesState = atomFamily<AtomThreadValue[], AtomChannelKey>({
  key: 'ChannelMessagesState',
  default: async ({ companyId, workspaceId, channelId }) => {
    const messages = await MessageViewAPIClient.feed(companyId, workspaceId, channelId);
    return messages.map(m => {
      //Update thread messages state

      return {
        companyId: companyId,
        threadId: m.thread_id,
      };
    });
  },
});
