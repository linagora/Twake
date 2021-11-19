import { MessageWithReplies, NodeMessage } from 'app/models/Message';
import MessageAPIClient from 'app/services/Apps/Messages/clients/MessageAPIClient';
import MessageViewAPIClient from 'app/services/Apps/Messages/clients/MessageViewAPIClient';
import { atomFamily } from 'recoil';

export type AtomMessageKey = { companyId: string; threadId: string; id: string };

export type AtomThreadKey = { companyId: string; threadId: string };

export type AtomChannelKey = { companyId: string; workspaceId: string; channelId: string };

export type AtomThreadValue = AtomThreadKey & {};

//TODO Probably not the way to go
const defaultMessageStore = new Map<string, MessageWithReplies>();
export const setMessage = (key: AtomMessageKey, message: MessageWithReplies) => {
  defaultMessageStore.set(key.id, message);
};

//TODO Probably not the way to go
const defaultThreadMessagesStore = new Map<string, AtomMessageKey[]>();
export const setThreadMessages = (key: AtomThreadKey, messages: AtomMessageKey[]) => {
  defaultThreadMessagesStore.set(key.threadId, messages);
};

export const MessagesWindowState = atomFamily<
  { start: string; end: string; reachedStart: boolean; reachedEnd: boolean },
  string
>({
  key: 'MessagesWindowState',
  default: key => {
    return { start: '', end: '', reachedStart: false, reachedEnd: false };
  },
});

export const MessageState = atomFamily<MessageWithReplies, AtomMessageKey>({
  key: 'MessageState',
  default: ({ companyId, threadId, id }) => {
    return defaultMessageStore.get(id) || MessageAPIClient.get(companyId, threadId, id);
  },
});

export const ThreadMessagesState = atomFamily<AtomMessageKey[], AtomThreadKey>({
  key: 'ThreadMessagesState',
  default: async ({ companyId, threadId }) => {
    const existing = defaultThreadMessagesStore.get(threadId);
    if (existing) return existing;
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
  default: async ({ companyId, workspaceId, channelId }) => [],
});
