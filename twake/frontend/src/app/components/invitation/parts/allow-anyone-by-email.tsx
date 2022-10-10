import Switch from 'app/components/inputs/switch';
import Languages from 'app/features/global/services/languages-service';
import { useInvitationUsers } from 'app/features/invitation/hooks/use-invitation-users';
import { allowAnyoneByEmailState } from 'app/features/invitation/state/invitation';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import React from 'react';
import { useRecoilState } from 'recoil';

export default (): React.ReactElement => {
  const [allow, setAllow] = useRecoilState(allowAnyoneByEmailState);
  const { user } = useCurrentUser();
  const { members_limit_reached } = useInvitationUsers();
  const email = user?.email.split('@').pop();

  const handleChange = (value: boolean): void => {
    setAllow(value);
  };

  return !members_limit_reached ? (
    <div className="flex flex-row space-x-2 mt-4 bg-zinc-200 px-3 py-2 mx-2 rounded-md border-transparent w-full h-9">
      <div className="flex-1">
        {Languages.t(
          'components.invitation.allow_anyone_by_email.text',
          [email],
          `Let anyone with @${email} email join this workspace`,
        )}
      </div>
      <div className="basis-1">
        <Switch checked={allow} onChange={handleChange} />
      </div>
    </div>
  ) : (
    <></>
  );
};
