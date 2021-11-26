import React, { useEffect } from 'react';
import ModalManager from 'app/components/Modal/ModalManager';
import UserService from 'services/user/UserService';
import WelcomeOnTwake from './popups/WelcomeOnTwake';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections.js';
import InitService from 'app/services/InitService';
import RouterServices from 'app/services/RouterService';
import Groups from 'services/workspaces/groups.js';
import { CompanyType } from 'app/models/Company';
import BlockedCompany from './popups/BlockedCompany';

const CompanyStatusComponent = (): JSX.Element => {
  const { companyId, workspaceId } = RouterServices.getStateFromRoute();
  const user = UserService.getCurrentUser();
  const onboarding: string | null = localStorage.getItem(`onboarding_${companyId}`);
  const workspace = DepreciatedCollections.get('workspaces').find(workspaceId);

  useEffect(() => {
    if (InitService.server_infos?.configuration?.accounts?.type === 'console') {
      isNewAccount();
    }

    isBlockedCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const isBlockedCompany = () => {
    if (!companyId) return;
    const userGroups: { [key: string]: CompanyType } = Groups.user_groups;
    const currentGroup = userGroups[companyId];

    if (currentGroup?.plan?.billing?.status === 'error') {
      return ModalManager.open(
        <BlockedCompany />,
        {
          position: 'center',
          size: { width: '600px' },
        },
        false,
      );
    }
  };

  return <></>;
};

export default CompanyStatusComponent;
