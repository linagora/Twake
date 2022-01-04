import { useEffect } from 'react';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';

import { ChannelType } from 'app/models/Channel';
import { ChannelsMineState, ChannelsReachableState, ChannelState } from '../atoms/Channels';
import useRouterWorkspace from './router/useRouterWorkspace';
import useRouterCompany from './router/useRouterCompany';
import ChannelsMineAPIClient from 'app/services/channels/ChannelsMineAPIClient';
import ChannelsReachableAPIClient from 'app/services/channels/ChannelsReachableAPIClient';

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
  refresh: (mine?: boolean, reachable?: boolean) => void;
} {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const [mine, setMine] = useRecoilState(ChannelsMineState);
  const [reachable, setReachable] = useRecoilState(ChannelsReachableState);

  const refreshMine = async () => {
    const res = await ChannelsMineAPIClient.get(companyId, workspaceId);

    if (res) setMine(res);
  };

  const refreshReachable = async () => {
    const res = await ChannelsReachableAPIClient.get(companyId, workspaceId);

    if (res) setReachable(res);
  };

  const refresh = (mine: boolean = true, reachable: boolean = true) => {
    if (mine) refreshMine();
    if (reachable) refreshReachable();
  };

  useEffect(() => {
    refresh();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { mine, reachable, refresh };
}
