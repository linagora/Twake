import React from 'react';

import Banner from 'app/components/Banner/Banner';
import { Button, Typography } from 'antd';
import Languages from 'services/languages/languages.js';
import ModalManager from 'app/components/Modal/ModalManager';
import UnverifiedAccount from './popups/UnverifiedAccount';
import BlockedAccount from './popups/BlockedAccount';
import UserService from 'services/user/user.js';

const AccountStatusComponent = (): JSX.Element => {
  const user = UserService.getCurrentUser();
  const maxUnverifiedDays: number = 7;
  const oneDay: number = 1000 * 60 * 60 * 24;
  const periodLimit: number = (user.created_at || 0) + maxUnverifiedDays * oneDay;
  const daysLeft: number = Math.ceil((periodLimit - Date.now()) / oneDay);

  const showBlockedModal = () =>
    ModalManager.open(
      <BlockedAccount email={user.email} />,
      {
        position: 'center',
        size: { width: '600px' },
      },
      false,
    );

  const showUnverifiedModal = () =>
    ModalManager.open(<UnverifiedAccount period={daysLeft} email={user.email} />, {
      position: 'center',
      size: { width: '600px' },
    });

  const showBanner = !user.is_verified;
  if (!user.is_verified && daysLeft <= 0) {
    showBlockedModal();
  }

  return (
    <>
      {showBanner && (
        <Banner
          type="important"
          content={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Typography.Title level={5} style={{ marginBottom: 0, color: 'var(--white)' }}>
                {Languages.t('components.account_verification_status_sentence', [
                  Languages.t('components.account_verication_status_unverified'),
                ])}
              </Typography.Title>
              <Button
                style={{ marginLeft: 17, height: 32, color: 'var(--red)' }}
                onClick={showUnverifiedModal}
              >
                {Languages.t('general.verify')}
              </Button>
            </div>
          }
        />
      )}
    </>
  );
};

export default AccountStatusComponent;
