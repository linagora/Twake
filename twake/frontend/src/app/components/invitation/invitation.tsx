import React, { useState } from 'react';
import { Button } from 'app/atoms/button/button';
import { Modal, ModalContent } from 'app/atoms/modal';
import {
  invitationActiveTab,
  invitationEmailsState,
  invitationSentState,
  invitationState,
} from 'app/features/invitation/state/invitation';
import { useCurrentWorkspace } from 'app/features/workspaces/hooks/use-workspaces';
import Tab from 'app/molecules/tabs';
import { useRecoilState } from 'recoil';
import Bulk_invitation from './parts/bulk-invitation';
import Custom_role_invitation from './parts/custom-role-invitation';
import InvitationChannels from './parts/invitation-channels';
import InvitationSent from './parts/invitation-sent';
import { useInvitation } from 'app/features/invitation/hooks/use-invitation';
import Languages from 'app/features/global/services/languages-service';
import WorkspaceLink from './parts/workspace-link';
import InvitationTarget from './parts/invitation-target';
import AllowAnyoneByEmail from './parts/allow-anyone-by-email';

enum InvitationTabs {
  custom = 0,
  bulk = 1,
}

export default (): React.ReactElement => {
  const [isOpen, setOpen] = useRecoilState(invitationState);
  const [activeTab, setInvitationTab] = useRecoilState(invitationActiveTab);
  const [invitations] = useRecoilState(invitationEmailsState);
  const workspace = useCurrentWorkspace();
  const [isInvitationSent] = useRecoilState(invitationSentState);
  const { send, reset } = useInvitation();
  const [sending, setSending] = useState<boolean>(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await send();
    } catch (error) {
      console.debug(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={() => {
        setOpen(false);
        reset();
      }}
      className="sm:w-[60vw] sm:max-w-2xl"
      style={{ minHeight: 'calc(70vh - 98px)' }}
    >
      <ModalContent
        textCenter
        title={
          isInvitationSent
            ? ''
            : Languages.t(
                'components.invitation.title',
                [workspace.workspace?.name],
                `Invite people to ${workspace.workspace?.name}`,
              )
        }
      >
        {!isInvitationSent ? (
          <>
            <AllowAnyoneByEmail />

            <hr />
            <InvitationTarget />
            <WorkspaceLink />
            <Tab
              tabs={[
                <div key="custom_role_invitation">
                  {Languages.t(
                    'components.invitation.custom_role_invitation',
                    [],
                    'Custom role invitation',
                  )}
                </div>,
                <div key="bulk_invitation">
                  {Languages.t('components.invitation.bulk_invitation', [], 'Bulk invitation')}
                </div>,
              ]}
              selected={activeTab}
              onClick={index => setInvitationTab(index)}
              className="w-full"
              parentClassName="basis-1/2 justify-center"
            />
            {activeTab === InvitationTabs.custom && <Custom_role_invitation />}
            {activeTab === InvitationTabs.bulk && <Bulk_invitation />}
            <Button
              className="mt-2 justify-center w-full"
              disabled={!invitations.length || sending}
              onClick={() => handleSend()}
              loading={sending}
            >
              {Languages.t('components.invitation.button', [], 'Send invitations')}
              <div className="font-medium h-5 px-1.5 flex items-center justify-center text-sm rounded-full ml-1 bg-white text-blue-500">
                {invitations.length}
              </div>
            </Button>
            <InvitationChannels />
          </>
        ) : (
          <InvitationSent />
        )}
      </ModalContent>
    </Modal>
  );
};
