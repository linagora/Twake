import Switch from 'app/components/inputs/switch';
import Languages from 'app/features/global/services/languages-service';
import { ToasterService } from 'app/features/global/services/toaster-service';
import { useInvitationUsers } from 'app/features/invitation/hooks/use-invitation-users';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import workspaceApiClient from 'app/features/workspaces/api/workspace-api-client';
import { useCurrentWorkspace } from 'app/features/workspaces/hooks/use-workspaces';
import React, { useState } from 'react';

export default (): React.ReactElement => {
  const { user } = useCurrentUser();
  const { members_limit_reached } = useInvitationUsers();
  const { workspace } = useCurrentWorkspace();
  const [allow, setAllow] = useState<boolean>(!!workspace?.preferences?.invite_domain);

  const currentUserDomain = user?.email.split('@').pop();

  const handleChange = async (value: boolean): Promise<void> => {
    if (value) {
      try {
        await workspaceApiClient.setInvitationDomain(
          workspace?.company_id as string,
          workspace?.id as string,
          currentUserDomain as string,
        );
        setAllow(true);
        ToasterService.success('Invitation domain updated');
      } catch (error) {
        ToasterService.error('Failed to set invitation domain');
      }
    }
  };

  return !members_limit_reached ? (
    <div className="flex flex-row space-x-2 mt-4 bg-zinc-200 px-3 py-2 mx-2 rounded-md border-transparent w-full h-9">
      <div className="flex-1">
        {Languages.t(
          'components.invitation.allow_anyone_by_email.text',
          [workspace?.preferences?.invite_domain || currentUserDomain],
          `Let anyone with @${
            workspace?.preferences?.invite_domain || currentUserDomain
          } email join this workspace`,
        )}
      </div>
      <div className="basis-1">
        <Switch
          checked={allow}
          onChange={handleChange}
          disabled={!!workspace?.preferences?.invite_domain}
        />
      </div>
    </div>
  ) : (
    <></>
  );
};
