import { MessageWithReplies } from 'app/models/Message';
import MessageAPIClient from 'app/services/Apps/Messages/clients/MessageAPIClient';
import { atomFamily } from 'recoil';

export type AtomMessageKey = { companyId: string; threadId: string; id?: string };
export type AtomThreadKey = { companyId: string; threadId: string };
export type AtomChannelKey = { companyId: string; workspaceId: string; channelId: string };
export type AtomThreadValue = AtomThreadKey & {};

export const MessagesWindowState = atomFamily<
  { start: string; end: string; reachedStart: boolean; reachedEnd: boolean },
  string
>({
  key: 'MessagesWindowState',
  default: () => {
    return { start: '', end: '', reachedStart: false, reachedEnd: false };
  },
});

export const MessageState = atomFamily<MessageWithReplies, AtomMessageKey>({
  key: 'MessageState',
  default: () => {
    return {} as MessageWithReplies;
  },
});

export const ThreadMessagesState = atomFamily<AtomMessageKey[], AtomThreadKey>({
  key: 'ThreadMessagesState',
  default: async () => [],
});

export const ChannelMessagesState = atomFamily<AtomThreadValue[], AtomChannelKey>({
  key: 'ChannelMessagesState',
  default: async () => [],
});
