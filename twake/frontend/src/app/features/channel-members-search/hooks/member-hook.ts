import ChannelMembersAPIClient from 'app/features/channel-members-search/api/members-api-client';
import { useRefreshPublicOrPrivateChannels } from 'app/features/channels/hooks/use-public-or-private-channels';
import useRouterChannel from 'app/features/router/hooks/use-router-channel';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ChannelMemberSelector } from '../state/store';
import { ParamsChannelMember } from '../types/channel-members';
import { useRefreshChannelMembers } from './members-hook';

export function useChannelMember(userId: string, params?: ParamsChannelMember) {
  const channelId = params?.channelId ? params.channelId : useRouterChannel();
  const workspaceId = params?.workspaceId ? params.workspaceId : useRouterWorkspace();
  const companyId = params?.companyId ? params.companyId : useRouterCompany();
  const parameters = { companyId, workspaceId, channelId };

  const member = useRecoilValue(ChannelMemberSelector({ channelId, userId }));
  const { refresh } = useRefreshChannelMembers(parameters);
  const { refresh: refreshChannelsBar } = useRefreshPublicOrPrivateChannels();
  const [loading, setLoading] = useState<boolean>(false);

  const leave = async (userId: string) => {
    setLoading(true);

    await ChannelMembersAPIClient.deleteMember(userId, {
      companyId,
      workspaceId,
      channelId,
    });
    refresh();
    refreshChannelsBar();
    setLoading(false);
  };

  const addMember = async (userId: string) => {
    setLoading(true);

    await ChannelMembersAPIClient.addMember(
      { user_id: userId },
      {
        companyId,
        workspaceId,
        channelId,
      },
    );
    setLoading(false);
    refresh();
  };

  return {
    member,
    refresh,
    leave,
    addMember,
    loading,
  };
}
