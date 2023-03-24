import React from 'react';
import Languages from 'app/features/global/services/languages-service';
import { LockOpenIcon } from '@heroicons/react/outline';

export default () => {
  return (
    <div className="main-view">
      <div className="no-channel-text text-center">
        <LockOpenIcon className="h-8 w-8 text-red-500 inline-block" />
        <br />
        <br />
        {Languages.t('scenes.client.join_private_channel.info')}
        <br />
        <br />
      </div>
    </div>
  );
};
