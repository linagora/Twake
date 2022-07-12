import { useState } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";
import { getPendingEmail } from "../state/store";
import { useChannelPendingEmails } from "./pending-emails-hook";
import ChannelPendingEmailApiClient from "app/features/channel-members.global/api/pending-emails-api-client";
import useRouterCompany from "app/features/router/hooks/use-router-company";
import useRouterWorkspace from "app/features/router/hooks/use-router-workspace";
import useRouterChannel from "app/features/router/hooks/use-router-channel";
import { SearchChannelMemberInputState } from "../state/search-channel-member";

export function usePendingEmail(email: string) {

    const companyId = useRouterCompany();
    const workspaceId = useRouterWorkspace();
    const channelId = useRouterChannel();

    const pEmail = useRecoilValue(getPendingEmail({channelId, email}));
    const { refresh } = useChannelPendingEmails();
    const [loading, setLoading] = useState<boolean>(false);

    const setSearchState = useSetRecoilState(SearchChannelMemberInputState);

    const cancelInvite = async () => {
        setLoading(true);

        await ChannelPendingEmailApiClient.delete(email, {
            companyId,
            workspaceId,
            channelId
        })
        .then(() => {
            setLoading(false);
            refresh();
        });
    }

    const addInvite = async () => {
        console.log("addInvite",email );
        setLoading(true);

        const guest = {
            workspace_id: workspaceId,
            channel_id: channelId,
            company_id: companyId,
            email: email,
        };

        await ChannelPendingEmailApiClient.add(guest, {
            companyId,
            workspaceId,
            channelId
        })
        .then(() => {
            setLoading(false);
            setSearchState('');
            refresh();
        });
    }

    return {
        loading,
        email: pEmail,
        cancelInvite,
        addInvite
    }
}
