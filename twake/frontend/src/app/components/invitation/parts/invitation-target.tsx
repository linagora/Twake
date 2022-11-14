import { BaseSmall } from 'app/atoms/text';
import Switch from 'app/components/inputs/switch';
import Languages from 'app/features/global/services/languages-service';
import { useInvitationChannels } from 'app/features/invitation/hooks/use-invitation-channels';
import { useInvitationUsers } from 'app/features/invitation/hooks/use-invitation-users';
import {
  invitationEmailsState,
  InvitationType,
  invitationTypeState,
} from 'app/features/invitation/state/invitation';
import React from 'react';
import { useRecoilState } from 'recoil';

export default (): React.ReactElement => {
  const [invitationType, setInvitationType] = useRecoilState(invitationTypeState);
  const { openSelection, selectedChannels } = useInvitationChannels();
  const [invitations, setInvitations] = useRecoilState(invitationEmailsState);
  const { allowed_guests, allowed_members } = useInvitationUsers();

  const changeInvitationType = (type: InvitationType) => {
    setInvitationType(type);

    if (type === InvitationType.guest && allowed_guests <= 0) return;
    if (type === InvitationType.member && allowed_members <= 0) return;
    setInvitations(invitations.map(({ email }) => ({ email, role: type })));
  };

  return (
    <div className="flex flex-row space-x-3 rounded-md border-transparent w-full pt-2">
      <div className=" bg-zinc-200 rounded-md py-2 m-2 px-3 justify-center align-middle">
        <BaseSmall>
          {Languages.t(
            'components.invitation.invitation_target.invite_as_guests',
            [],
            'Invite all as guests',
          )}
        </BaseSmall>
        <Switch
          checked={invitationType === InvitationType.guest}
          className="ml-2"
          onChange={() => changeInvitationType(InvitationType.guest)}
        />
      </div>
      <div className=" bg-zinc-200 rounded-md py-2 m-2 px-3 justify-center align-middle">
        <BaseSmall>
          {Languages.t(
            'components.invitation.invitation_target.invite_as_members',
            [],
            'Invite all as members',
          )}
        </BaseSmall>
        <Switch
          checked={invitationType === InvitationType.member}
          className="ml-2"
          onChange={() => changeInvitationType(InvitationType.member)}
        />
      </div>
      <div className="flex-grow bg-zinc-200 rounded-md py-2 m-2 px-3 justify-center align-middle">
        <div
          className="cursor-pointer flex relative justify-center border-transparent hover:text-blue-600 transition-colors text-blue-500 font-semibold "
          onClick={() => openSelection()}
        >
          {Languages.t(
            'components.invitation.invitation_target.channels_button',
            [],
            'Channels to invite',
          )}
          <div className="font-medium h-5 px-1.5 flex items-center justify-center text-sm rounded-full ml-1 text-white bg-blue-500">
            {selectedChannels.length}
          </div>
        </div>
      </div>
    </div>
  );
};
