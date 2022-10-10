import React from 'react';
import AllowAnyoneByEmail from './allow-anyone-by-email';
import InvitationInputList from './invitation-input-list';
import InvitationTarget from './invitation-target';
import Workspace_link from './workspace-link';

export default(): React.ReactElement => {
  return (
    <div className='flex flex-col'>
      <Workspace_link />
      <InvitationTarget />
      <AllowAnyoneByEmail />
      <hr className='my-4' />
      <InvitationInputList />
    </div>
  );
}
