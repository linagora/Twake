import { LoadingState } from "app/features/global/state/atoms/Loading";
import useRouterChannel from "app/features/router/hooks/use-router-channel";
import useRouterCompany from "app/features/router/hooks/use-router-company";
import useRouterWorkspace from "app/features/router/hooks/use-router-workspace";
import { useRecoilState } from "recoil";
import { listPendingEmailsStateFamily } from "../state/store";
import { ChannelPendingEmail, ParamsChannelMember } from "../types/channel-members";
import ChannelPendingEmailApiClient from "app/features/channel-members.global/api/pending-emails-api-client";

export function useChannelPendingEmails(params?: ParamsChannelMember): {
    emails: ChannelPendingEmail[],
    loading: boolean,
    refresh: () => Promise<void>
}{
    const companyId = params?.companyId ? params.companyId : useRouterCompany();
    const channelId = params?.companyId ? params.companyId : useRouterChannel();
    const workspaceId = params?.companyId ? params.companyId : useRouterWorkspace();

    const parameters = { companyId, workspaceId, channelId};

    const [loading, setLoading] = useRecoilState(LoadingState('useChannelPendingEmails'));
    const [emails, setEmails] = useRecoilState(listPendingEmailsStateFamily(parameters));

    const refresh = async () => {
        setLoading(true);
        const pendingEmails = await ChannelPendingEmailApiClient.list(parameters);

        if(pendingEmails) {
            setEmails(pendingEmails);
        }
        setLoading(false);
    };

    return {
        emails,
        loading,
        refresh
    }

}