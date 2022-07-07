import ChannelMembersAPIClient from "app/features/channel-members.global/api/members-api-client";
import { useGlobalEffect } from "app/features/global/hooks/use-global-effect";
import { LoadingState } from "app/features/global/state/atoms/Loading";
import { delayRequest } from "app/features/global/utils/managedSearchRequest";
import useRouterChannel from "app/features/router/hooks/use-router-channel";
import useRouterCompany from "app/features/router/hooks/use-router-company";
import useRouterWorkspace from "app/features/router/hooks/use-router-workspace";
import UserAPIClient, { SearchContextType } from "app/features/users/api/user-api-client";
import { useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { SearchChannelMemberInputState } from "../state/search-channel-member";
import { ParamsChannelMember, ChannelMemberWithUser } from "../types/channel-members";

export const useSearchChannelMember = () => {
    const companyId = useRouterCompany();
    const workspaceId = useRouterWorkspace();
    const channelId = useRouterChannel(); // TODO this should be a hook parameter
    const searchInput = useRecoilValue(SearchChannelMemberInputState);
    const [loading, setLoading] = useRecoilState(LoadingState('useSearchChannelMember'));
    const [listChannelMembers, setChannelMembers] = useState<ChannelMemberWithUser[]>([]);
    const context: ParamsChannelMember = {
        companyId,
        workspaceId,
        channelId
    }

    const refresh = async () => {
        setLoading(true);
        const response = await ChannelMembersAPIClient.getMembers(context, searchInput);

        setChannelMembers(response);
        setLoading(false);
    };


    useGlobalEffect(
        'useSearchChannelMember',
        () => {
            (async () => {
                setLoading(true);
                if (searchInput) {
                    delayRequest('useSearchChannelMember', async () => {
                        await refresh();
                    });
                }
            })();
        },
        [searchInput],
    );

    return {
        refresh,
        loading,
        listChannelMembers
    }
}
