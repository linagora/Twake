import { atom, atomFamily } from 'recoil';
import _ from 'lodash';

import { ChannelType } from 'app/models/Channel';

export const ChannelState = atomFamily<ChannelType, string>({
  key: 'ChannelState',
  default: id => ({ id } as ChannelType),
});

export const MineChannelsState = atom<ChannelType[]>({
  key: 'MineChannelsState',
  default: [],
});

export const ReachableChannelsState = atom<ChannelType[]>({
  key: 'ReachableChannelsState',
  default: [],
});

export const DirectChannelsState = atom<ChannelType[]>({
  key: 'DirectChannelsState',
  default: [],
});
