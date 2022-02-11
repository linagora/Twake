import { useRecoilState } from 'recoil';

import {
  AtomChannelMembersKey,
  ChannelMemberType,
} from 'app/features/channel-members/types/channel-member-types';
import { ChannelMembersState } from 'app/features/channel-members/state/channel-members';
import { useGlobalEffect } from 'app/features/global/hooks/use-global-effect';
import { LoadingState } from 'app/features/global/state/atoms/Loading';
import ChannelMembersAPIClient from '../api/channel-members-api-client';

export const useChannelMembers = (
  key: AtomChannelMembersKey,
): {
  channelMembers: ChannelMemberType[];
  loading: boolean;
  refresh: () => Promise<void>;
} => {
  const [channelMembers, _setChannelMembers] = useRecoilState(ChannelMembersState(key));
  const [loading, setLoading] = useRecoilState(LoadingState(`channel-members-${key.channelId}`));

  const refresh = async () => {
    const { companyId, workspaceId, channelId } = key;
    const channelMembersUpdated = await ChannelMembersAPIClient.list({
      companyId,
      workspaceId,
      channelId,
    });

    if (channelMembersUpdated) _setChannelMembers(channelMembersUpdated);
  };

  useGlobalEffect(
    'useChannelMembers',
    async () => {
      if (!channelMembers) setLoading(true);

      await refresh();

      setLoading(false);
    },
    [key, channelMembers],
  );

  // useRealTimeHook

  return {
    channelMembers,
    loading,
    refresh,
  };
};
