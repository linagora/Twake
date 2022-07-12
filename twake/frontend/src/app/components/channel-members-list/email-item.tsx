import Avatar from "app/atoms/avatar";
import { Button } from "app/atoms/button/button";
import Languages from "app/features/global/services/languages-service";
import { PendingEmail } from "app/features/pending-emails/types/pending-email";
import { usePendingEmail } from "app/features/channel-members.global/hooks/pending-email-hook";

type IProps = {
    email: PendingEmail;
};

export const EmailItem = (props: IProps): JSX.Element => {
    const { email } = props.email;
    const { loading, cancelInvite } = usePendingEmail(email);

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
                    onClick={() => cancelInvite()}
                >
                    {Languages.t('general.cancel')}
                </Button>
            </div>
        </div>
    )
}