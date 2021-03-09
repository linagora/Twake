import React, { useEffect, useState } from 'react';

import Banner from 'app/components/Banner/Banner';
import { Button, Typography } from 'antd';
import Languages from 'services/languages/languages.js';
import ModalManager from 'app/components/Modal/ModalManager';
import UnverifiedAccount from './popups/UnverifiedAccount';
import BlockedAccount from './popups/BlockedAccount';

const AccountStatusComponent = (): JSX.Element => {
  const [period, setPeriod] = useState<number>(8);
  const [displayBanner, setDisplayBanner] = useState<boolean>(
    period < 7 && period > 0 ? true : false,
  );

  useEffect(() => {
    isBlockedAccount();
  }, [period]);

  const onClickButton = () =>
    ModalManager.open(<UnverifiedAccount />, {
      position: 'center',
      size: { width: '600px' },
    });

  const isBlockedAccount = () => {
    if (period === 0)
      return ModalManager.open(
        <BlockedAccount />,
        {
          position: 'center',
          size: { width: '600px' },
        },
        false,
      );
  };

  return (
    <>
      {displayBanner && (
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
                onClick={onClickButton}
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
