import React from 'react';
import InvitationInputBulk from './invitation-input-bulk';
import InvitationTarget from './invitation-target';
import WorkspaceLink from './workspace-link';

export default (): React.ReactElement => {
  return (
    <div className="flex flex-col">
      <WorkspaceLink />
      <InvitationTarget />
      <hr className="my-4" />
      <InvitationInputBulk />
    </div>
  );
};
