import useRouterChannel from "app/features/router/hooks/use-router-channel";
import { useRecoilValue } from "recoil";
import { getChannelMember } from "../state/store";
import { ChannelMemberType, ParamsChannelMember } from "../types/channel-members";

export function useChannelMember(userId: string, params?: ParamsChannelMember): ChannelMemberType | null {

    const channelId = params?.channelId ? params.channelId : useRouterChannel();
    const member = useRecoilValue(getChannelMember({channelId, userId}));

    if(member) {
        return member;
    }

    return null;
}