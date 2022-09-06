import {useRecoilState, useSetRecoilState} from 'recoil';

import {ChannelType} from 'app/features/channels/types/channel';
import {DirectChannelsState} from '../state/channels';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import ChannelsMineAPIClient from 'app/features/channels/api/channels-mine-api-client';
import {useRealtimeRoom} from 'app/features/global/hooks/use-realtime';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import {LoadingState} from 'app/features/global/state/atoms/Loading';
import {useGlobalEffect} from 'app/features/global/hooks/use-global-effect';
import {useSetUserList} from 'app/features/users/hooks/use-user-list';
import {UserType} from 'app/features/users/types/user';
import {useSetChannel} from './use-channel';
import ChannelAPIClient from '../api/channel-api-client';
import MenusManager from 'app/components/menus/menus-manager.js';
import RouterService from 'app/features/router/services/router-service';

export function useRefreshDirectChannels(): {
  refresh: () => Promise<void>;
} {
  const companyId = useRouterCompany();
  const { set: setUserList } = useSetUserList('useRefreshDirectChannels');
  const { set } = useSetChannel();

  const _setDirectChannels = useSetRecoilState(DirectChannelsState(companyId));

  const refresh = async () => {
    const directChannels = await ChannelsMineAPIClient.get({ companyId, workspaceId: 'direct' });

    if (directChannels) _setDirectChannels(directChannels);

    const users: UserType[] = [];

    directChannels.forEach(c => {
      if (c.users) users.push(...c.users);
    });

    directChannels.forEach(c => set(c));

    if (users) setUserList(users);
  };

  return { refresh };
}

export function useDirectChannelsSetup() {
  const companyId = useRouterCompany();
  const [, setLoading] = useRecoilState(LoadingState(`channels-direct-${companyId}`));
  const [didLoad, setDidLoad] = useRecoilState(
    LoadingState(`channels-direct-did-load-${companyId}`),
  );
  const { refresh } = useRefreshDirectChannels();

  useGlobalEffect(
    'useDirectChannels',
    async () => {
      if (!didLoad) setLoading(true);
      await refresh();
      setLoading(false);
      setDidLoad(true);
    },
    [companyId],
  );

  useRealtimeRoom<ChannelType[]>(
    ChannelsMineAPIClient.websockets(companyId, 'direct')[0],
    'useDirectChannels',
    (_action) => {
      //TODO replace this to avoid calling backend every time
      if (_action === 'saved') refresh();
    },
  );
}

export function useDirectChannels(): {
  directChannels: ChannelType[];
  refresh: () => Promise<void>;
  openDiscussion: (membersId: string[]) => Promise<void>;
} {
  const companyId = useRouterCompany();
  const [directChannels] = useRecoilState(DirectChannelsState(companyId));
  const { refresh } = useRefreshDirectChannels();

  const openDiscussion = async (membersIds: string[]) => {
    const channel = await ChannelAPIClient.getDirect(companyId, membersIds);
    await refresh();
    if (channel) {
      RouterService.push(
        RouterService.generateRouteFromState({
          channelId: channel.id,
          companyId: channel.company_id,
        }),
      );
    }
    MenusManager.closeMenu();
  };

  return {
    refresh,
    directChannels,
    openDiscussion,
  };
}
