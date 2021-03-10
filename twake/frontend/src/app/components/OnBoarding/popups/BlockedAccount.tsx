import { Button, Row, Typography } from 'antd';
import React, { useState } from 'react';
import ObjectModal from '../../ObjectModal/ObjectModal';
import Languages from 'services/languages/languages.js';

type PropsType = {};

const BlockedAccount = ({}: PropsType): JSX.Element => {
  const [email, setEmail] = useState<string>('dreamteam@linagora.com');
  const onClickButton = () => console.log('clicked');

  return (
    <ObjectModal
      title={Languages.t('components.account_verification_status_sentence', [
        Languages.t('components.account_verication_status_blocked'),
      ])}
      titleColor="var(--white)"
      titleCenter
      headerStyle={{ backgroundColor: 'var(--red)', color: 'var(--white)', height: 76 }}
      hideFooterDivider
      footerAlign="center"
      footer={
        <Button type="ghost" size="small" onClick={onClickButton}>
          {Languages.t('general.re_send')}
        </Button>
      }
    >
      <Row justify="center" style={{ marginTop: 36 }}>
        <Typography.Title
          level={3}
          style={{
            textAlign: 'center',
            margin: 0,
            width: 493,
          }}
        >
          {Languages.t('components.blocked_account.trial_period_over')}
        </Typography.Title>
      </Row>

      <Row justify="center" style={{ marginTop: 24 }}>
        <Typography.Text
          style={{
            textAlign: 'center',
            height: 22,
          }}
        >
          {Languages.t('components.unverified_account.verification_details')}
        </Typography.Text>
      </Row>

      <Row justify="center" style={{ marginTop: 12 }}>
        <Typography.Text
          strong
          style={{
            textAlign: 'center',
            height: '22px',
          }}
        >
          {email}
        </Typography.Text>
      </Row>

      <Row justify="center" style={{ marginTop: 32, marginBottom: 8 }}>
        <Typography.Text
          style={{
            textAlign: 'center',
            fontSize: 15,
            height: '22px',
          }}
        >
          {Languages.t('components.unverified_account.re_send_email')}
        </Typography.Text>
      </Row>
    </ObjectModal>
  );
};

export default BlockedAccount;
