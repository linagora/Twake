import { atom, atomFamily } from 'recoil';
import _ from 'lodash';

import { ChannelType } from 'app/features/channels/types/channel';

type ChannelsListContextType = { companyId: string; workspaceId: string };

export const ChannelState = atomFamily<ChannelType, string>({
  key: 'ChannelState',
  default: id => ({ id } as ChannelType),
});

export const MineChannelsState = atomFamily<ChannelType[] | undefined, ChannelsListContextType>({
  key: 'MineChannelsState',
  default: undefined,
});

export const ReachableChannelsState = atomFamily<ChannelType[], ChannelsListContextType>({
  key: 'ReachableChannelsState',
  default: [],
});

export const DirectChannelsState = atomFamily<ChannelType[], ChannelsListContextType>({
  key: 'DirectChannelsState',
  default: [],
});
