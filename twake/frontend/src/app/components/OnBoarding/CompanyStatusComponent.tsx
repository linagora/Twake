import React, { useEffect } from 'react';
import ModalManager from 'app/components/Modal/ModalManager';
import UserService from 'services/user/user.js';
import WelcomeOnTwake from './popups/WelcomeOnTwake';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections.js';
import InitService from 'app/services/InitService';
import RouterServices from 'app/services/RouterService';

const CompanyStatusComponent = (): JSX.Element => {
  const { companyId, workspaceId } = RouterServices.getStateFromRoute();
  const user = UserService.getCurrentUser();
  const onboarding: string | null = localStorage.getItem(`onboarding_${companyId}`);
  const workspace = DepreciatedCollections.get('workspaces').find(workspaceId);

  useEffect(() => {
    if (InitService.server_infos?.configuration?.accounts?.type === 'console') {
      isNewAccount();
    }
  }, []);

  const isNewCompany = (): boolean => {
    const oneDay = 1000 * 60 * 60 * 24;
    const createdDay = workspace?.group?.stats?.created_at;
    const currentDay = Date.now();
    const currentPeriod = Math.round(Math.round(currentDay - createdDay) / oneDay);

    return currentPeriod <= 7 ? true : false;
  };

  const isNewAccount = () => {
    if (!workspace?.id) return;

    const isNewUser: boolean =
      onboarding !== 'completed' &&
      workspace?.group?.stats?.total_members <= 1 &&
      isNewCompany() &&
      !user?.is_verified;

    if (isNewUser) {
      localStorage.setItem(`onboarding_${companyId}`, 'completed');
      return ModalManager.open(<WelcomeOnTwake email={user.email} />, {
        position: 'center',
        size: { width: '600px' },
      });
    }
  };

  return <></>;
};

export default CompanyStatusComponent;
