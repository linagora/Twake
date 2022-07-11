import ChannelMembersAPIClient from "app/features/channel-members.global/api/members-api-client";
import { useGlobalEffect } from "app/features/global/hooks/use-global-effect";
import { LoadingState } from "app/features/global/state/atoms/Loading";
import { delayRequest } from "app/features/global/utils/managedSearchRequest";
import useRouterChannel from "app/features/router/hooks/use-router-channel";
import useRouterCompany from "app/features/router/hooks/use-router-company";
import useRouterWorkspace from "app/features/router/hooks/use-router-workspace";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { SearchChannelMemberInputState } from "../state/search-channel-member";
import { listChannelMembersStateFamily } from "../state/store";
import { ParamsChannelMember, ChannelMemberWithUser } from "../types/channel-members";


export const useRefreshSearchChannelMembers = (context: ParamsChannelMember) => {

    const searchInput = useRecoilValue(SearchChannelMemberInputState);
    const setLoading = useSetRecoilState(LoadingState('useSearchChannelMembers'));
    const [listChannelMembers, setChannelMembers] = useRecoilState<ChannelMemberWithUser[]>(listChannelMembersStateFamily(context));

    const refresh = async () => {
        setLoading(true);
        const response = await ChannelMembersAPIClient.getMembers(context, searchInput);

        setChannelMembers(response);
        setLoading(false);
    };

    return {
        refresh,
        listChannelMembers
    }
}

export const useSearchChannelMembers = (channelId: string) => {
    const companyId = useRouterCompany();
    const workspaceId = useRouterWorkspace();

    const context: ParamsChannelMember = {
        companyId,
        workspaceId,
        channelId: channelId ? channelId : useRouterChannel()
    }

    const searchInput = useRecoilValue(SearchChannelMemberInputState);
    const [loading, setLoading] = useRecoilState(LoadingState('useSearchChannelMembers'));
    const { refresh, listChannelMembers } = useRefreshSearchChannelMembers(context);

    useGlobalEffect(
        'useSearchChannelMembers',
        () => {
            (async () => {
                setLoading(true);
                if (searchInput) {
                    delayRequest('useSearchChannelMembers', async () => {
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
