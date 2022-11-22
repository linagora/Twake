import React from 'react';
import InvitationInputList from './invitation-input-list';

export default (): React.ReactElement => {
  return (
    <div className="flex flex-col">
      <hr className="my-4" />
      <InvitationInputList />
    </div>
  );
};
