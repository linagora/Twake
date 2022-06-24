import ChannelMembersApiClient from "app/features/channel-members.global/api/members-api-client";
import { useGlobalEffect } from "app/features/global/hooks/use-global-effect";
import { useRecoilState } from "recoil";
import { ChannelMemberType, ChannelMemberWithUser, ParamsChannelMember } from "../types/channel-members";
import { listChannelMembersStateFamily } from "../state/store";
import { LoadingState } from "app/features/global/state/atoms/Loading";
import useRouterCompany from "app/features/router/hooks/use-router-company";
import useRouterChannel from "app/features/router/hooks/use-router-channel";
import useRouterWorkspace from "app/features/router/hooks/use-router-workspace";
// backend/node/src/services/channels/entities/channel-member.ts

export function useChannelMembers(params?: ParamsChannelMember): {
    members: ChannelMemberWithUser[],
    loading: boolean,
    refresh: () => Promise<void>
} {
    const companyId = params?.companyId ? params.companyId : useRouterCompany();
    const channelId = params?.companyId ? params.companyId : useRouterChannel();
    const workspaceId = params?.companyId ? params.companyId : useRouterWorkspace();

    const parameters = { companyId, workspaceId, channelId};

    const [loading, setLoading] = useRecoilState(LoadingState('useChannelMembers'));
    const [members, setMembers] = useRecoilState(listChannelMembersStateFamily(parameters));

    const refresh = async () => {
        console.log("referesh ", )
        setLoading(true);
        const members = await ChannelMembersApiClient.getMembers(parameters);
        console.log("members", members);

        if(members) {
            setMembers(members);
        }
        setLoading(false);
    };


    //Will be called once only
    useGlobalEffect(
        "useChannelMembers",
        () => {
            refresh();
        },
        []
    );

    return {
        members,
        loading,
        refresh
    }
}