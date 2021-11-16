import { useRecoilValue } from 'recoil';
import {
  AtomChannelKey,
  AtomMessageKey,
  AtomThreadKey,
  ChannelMessagesState,
  MessageState,
  ThreadMessagesState,
} from '../atoms/Messages';

export const useMessage = (key: AtomMessageKey) => {
  return useRecoilValue(MessageState(key));
};

export const useThreadMessages = (key: AtomThreadKey) => {
  return useRecoilValue(ThreadMessagesState(key));
};

export const useChannelMessages = (key: AtomChannelKey) => {
  return useRecoilValue(ChannelMessagesState(key));
};
