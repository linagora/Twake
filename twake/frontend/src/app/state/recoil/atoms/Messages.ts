import { MessageWithReplies } from 'app/models/Message';
import MessageAPIClient from 'app/services/Apps/Messages/clients/MessageAPIClient';
import { atomFamily } from 'recoil';
import ExtendedState from '../utils/ExtendedState';

export type AtomMessageKey = { companyId: string; threadId: string; id?: string };

export type AtomThreadKey = { companyId: string; threadId: string };

export type AtomChannelKey = { companyId: string; workspaceId: string; channelId: string };

export type AtomThreadValue = AtomThreadKey & {};

export const MessagesWindowState = atomFamily<
  { start: string; end: string; reachedStart: boolean; reachedEnd: boolean },
  string
>({
  key: 'MessagesWindowState',
  default: key => {
    return { start: '', end: '', reachedStart: false, reachedEnd: false };
  },
});

export const MessageStateExtended = new ExtendedState<MessageWithReplies>();
export const MessageState = atomFamily<MessageWithReplies, AtomMessageKey>({
  key: 'MessageState',
  default: ({ companyId, threadId, id }) => {
    return (
      MessageStateExtended.get(id || threadId) ||
      MessageAPIClient.get(companyId, threadId, id || threadId)
    );
  },
});

export const ThreadMessagesStateExtended = new ExtendedState<AtomMessageKey[]>();
export const ThreadMessagesState = atomFamily<AtomMessageKey[], AtomThreadKey>({
  key: 'ThreadMessagesState',
  default: async ({ companyId, threadId }) => {
    const existing = ThreadMessagesStateExtended.get(threadId);
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

export const ChannelMessagesStateExtended = new ExtendedState<AtomThreadValue[]>();
export const ChannelMessagesState = atomFamily<AtomThreadValue[], AtomChannelKey>({
  key: 'ChannelMessagesState',
  default: async ({ companyId, workspaceId, channelId }) =>
    ChannelMessagesStateExtended.get(channelId) || [],
});
