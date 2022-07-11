
import { atom } from 'recoil';

export const activeChannelAttachementListTabState = atom<number>({
  key: 'activeChannelAttachementListTabState',
  default: 0,
});

export const channelAttachmentListState = atom<boolean>({
  key: 'channelAttachmentListState',
  default: false,
});
