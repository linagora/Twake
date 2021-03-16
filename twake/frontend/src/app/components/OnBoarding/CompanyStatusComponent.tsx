import React, { useEffect } from 'react';
import ModalManager from 'app/components/Modal/ModalManager';
import AddMailsInWorkspace from './popups/AddMailsInWorkspace';
import Workspaces from 'services/workspaces/workspaces.js';
import UserService from 'services/user/user.js';
import VerifyEmail from './popups/VerifyEmail';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections.js';
import InitService from 'app/services/InitService';

const CompanyStatusComponent = (): JSX.Element => {
  const workspace = Workspaces.getCurrentWorkspace();
  const user = UserService.getCurrentUser();
  const onboarding: string | null = localStorage.getItem(`onboarding_${workspace.id}`);
  const company = DepreciatedCollections.get('workspaces').find(workspace.id);

  useEffect(() => {
    if (InitService.server_infos.auth?.console?.use === true) {
      displayAddMailsInWorkspace();
      isNewAccount();
    }
  }, []);

  const isNewWorkspace = (): boolean => {
    const oneDay: number = 1000 * 60 * 60 * 24;
    // workspace created_at
    const createdDay: number = workspace.stats?.created_at;
    const currentDay: number = Date.now();
    const currentPeriod: number = Math.round(Math.round(currentDay - createdDay) / oneDay);

    return currentPeriod <= 7 ? true : false;
  };

  const displayAddMailsInWorkspace = (): void => {
    if (!workspace?.id) return;

    const shouldDisplayModal: boolean =
      onboarding !== 'completed' &&
      workspace.stats.total_members === 1 &&
      workspace.stats.total_guests === 0 &&
      isNewWorkspace();

    if (shouldDisplayModal) {
      localStorage.setItem(`onboarding_${workspace.id}`, 'completed');
      return ModalManager.open(<AddMailsInWorkspace />, {
        position: 'center',
        size: { width: '600px' },
      });
    }
  };

  const isNewAccount = () => {
    if (!company?.id) return;

    const isNewUser =
      onboarding &&
      onboarding !== 'completed' &&
      company.stats?.total_members === 1 &&
      company.stats?.total_guests === 0;

    if (isNewUser)
      return ModalManager.open(<VerifyEmail email={user.email} />, {
        position: 'center',
        size: { width: '600px' },
      });
  };

  return <></>;
};

export default CompanyStatusComponent;
