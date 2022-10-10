import React from 'react';
import Icon from 'components/icon/icon.js';
import Languages from 'app/features/global/services/languages-service';
import './add-user-button.scss';
import { useRecoilState } from 'recoil';
import { invitationState } from 'app/features/invitation/state/invitation';
import { useInvitationUsers } from 'app/features/invitation/hooks/use-invitation-users';

export default () => {
  const [, setInvitationOpen] = useRecoilState(invitationState);
  const { allowed_guests, allowed_members } = useInvitationUsers();

  return allowed_guests > 0 || allowed_members > 0 ? (
    <div
      className="channel addUserButton"
      onClick={() => {
        setInvitationOpen(true);
      }}
    >
      <div className="icon">
        <div className="iconBox">
          <Icon type="plus" />
        </div>
      </div>
      <div className="text">
        {Languages.t(
          'scenes.app.popup.workspaceparameter.pages.collaboraters_adding_button',
          [],
          'Ajouter des collaborateurs',
        )}
      </div>
    </div>
  ) : (
    <></>
  );
};
