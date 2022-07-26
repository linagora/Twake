import { MailIcon } from '@heroicons/react/outline';
import { XIcon } from '@heroicons/react/solid';
import { Tooltip } from 'antd';
import { Button } from 'app/atoms/button/button';
import { Info } from 'app/atoms/text';
import { usePendingEmail } from 'app/features/channel-members-search/hooks/use-pending-email-hook';
import Languages from 'app/features/global/services/languages-service';
import { PendingEmail } from 'app/features/pending-emails/types/pending-email';

type IProps = {
  email: PendingEmail;
};

export const EmailItem = (props: IProps): JSX.Element => {
  const { email } = props.email;
  const { loading, cancelInvite } = usePendingEmail(email);

  return (
    <>
      <div className="flex grow items-center space-x-1">
        <MailIcon className="h-6 w-6 text-zinc-500" />
        <div>
          <span className="pl-2">
            {email}{' '}
            <Info>
              (
              {Languages.t(
                'scenes.client.channels_bar.modals.parts.channel_member_row.label.pending_email',
              )}
              )
            </Info>
          </span>
        </div>
      </div>
      <div>
        <Tooltip
          placement="top"
          title={Languages.t('scenes.app.popup.workspaceparameter.pages.cancel_invitation')}
        >
          <Button
            theme="default"
            size="sm"
            icon={XIcon}
            loading={loading}
            onClick={() => cancelInvite()}
          ></Button>
        </Tooltip>
      </div>
    </>
  );
};
