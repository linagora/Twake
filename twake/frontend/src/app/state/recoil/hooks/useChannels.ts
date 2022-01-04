import { useEffect } from 'react';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';

import { ChannelType } from 'app/models/Channel';
import { ChannelsMineState, ChannelsReachableState, ChannelState } from '../atoms/Channels';
import useRouterWorkspace from './router/useRouterWorkspace';
import useRouterCompany from './router/useRouterCompany';
import ChannelsMineAPIClient from 'app/services/channels/ChannelsMineAPIClient';
import ChannelsReachableAPIClient from 'app/services/channels/ChannelsReachableAPIClient';
import { isDirectChannel, isPrivateChannel, isPublicChannel } from 'app/services/channels/utils';

export function useChannel(channelId: string) {
  const channel = useRecoilValue(ChannelState(channelId));
  return { channel };
}

//Fixme: it is for retrocompatibility, currently atom is set from channels themselves
export function useSetChannel() {
  const set = useRecoilCallback(({ set }) => (channel: ChannelType) => {
    if (channel.id) set(ChannelState(channel.id), channel);
  });
  return { set };
}

export function useChannels(): {
  mine: ChannelType[];
  reachable: ChannelType[];
  directChannels: ChannelType[];
  privateChannels: ChannelType[];
  publicChannels: ChannelType[];
  refresh: (mine?: boolean, reachable?: boolean) => void;
} {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const [mine, _setMine] = useRecoilState(ChannelsMineState);
  const [reachable, _setReachable] = useRecoilState(ChannelsReachableState);

  const setMine = async () => {
    const res = await ChannelsMineAPIClient.get(companyId, workspaceId);

    if (res) _setMine(res);
  };

  const setReachable = async () => {
    const res = await ChannelsReachableAPIClient.get(companyId, workspaceId);

    if (res) _setReachable(res);
  };

  const refresh = (mine: boolean = true, reachable: boolean = true) => {
    if (mine) setMine();
    if (reachable) setReachable();
  };

  useEffect(() => {
    refresh();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    mine,
    reachable,
    refresh,
    directChannels: mine.filter(c => c.visibility && isDirectChannel(c.visibility)),
    privateChannels: mine.filter(c => c.visibility && isPrivateChannel(c.visibility)),
    publicChannels: mine.filter(c => c.visibility && isPublicChannel(c.visibility)),
  };
}
