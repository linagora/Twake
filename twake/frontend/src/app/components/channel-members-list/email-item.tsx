import Avatar from "app/atoms/avatar";
import { Button } from "app/atoms/button/button";
import Languages from "app/features/global/services/languages-service";
import { LoadingState } from "app/features/global/state/atoms/Loading";
import { PendingEmail } from "app/features/pending-emails/types/pending-email";
import { useRecoilState } from "recoil";
import ChannelPendingEmailApiClient from "app/features/channel-members.global/api/pending-emails-api-client";
import useRouterCompany from "app/features/router/hooks/use-router-company";
import useRouterWorkspace from "app/features/router/hooks/use-router-workspace";
import useRouterChannel from "app/features/router/hooks/use-router-channel";

type IProps = {
    email: PendingEmail,
    onRefreshPendingList: () => void;
};

export const EmailItem = (props: IProps): JSX.Element => {
    const { email } = props.email;
    const companyId = useRouterCompany();
    const workspaceId = useRouterWorkspace();
    const channelId = useRouterChannel();
    const [loading, setLoading] = useRecoilState(LoadingState('cancelPendingEmailLoading'));

    const cancelPendingEmailRequest = async (email: string) => {
        setLoading(true);

        await ChannelPendingEmailApiClient.delete(email, {
            companyId,
            workspaceId,
            channelId
        })
        .then(() => {
            setLoading(false);
            props.onRefreshPendingList();
        });
    }

    return (
        <div className="flex justify-between py-1 hover:bg-zinc-200">
            <div className="flex items-center space-x-1">
                <Avatar className="" size="xs" />
                <div>
                    <span className="pl-2">{ email }</span>
                </div>
            </div>
            <div>
                <Button
                    theme="danger"
                    size="sm"
                    loading={loading}
                    onClick={() => cancelPendingEmailRequest(email || '')}
                >
                    {Languages.t('general.cancel')}
                </Button>
            </div>
        </div>
    )
}