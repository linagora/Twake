import { Button, Row, Typography } from 'antd';
import React, { useState } from 'react';
import ObjectModal from '../../ObjectModal/ObjectModal';
import Languages from 'services/languages/languages.js';

type PropsType = {
  period: number;
  email: string;
};

const UnverifiedAccount = ({ period, email }: PropsType): JSX.Element => {
  const onClickButton = () => console.log('clicked');

  return (
    <ObjectModal
      closable
      title={Languages.t('components.account_verification_status_sentence', [
        Languages.t('components.account_verication_status_unverified'),
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
      <Row justify="center" style={{ marginTop: 32, height: 68 }}>
        <Typography.Text
          type="danger"
          style={{
            width: 435,
            textAlign: 'center',
            margin: 0,
          }}
        >
          {Languages.t('components.unverified_account.typography_text_danger', [period])}
        </Typography.Text>
      </Row>

      <Row justify="center" style={{ marginTop: 12, height: 22 }}>
        <Typography.Text
          style={{
            textAlign: 'center',
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

export default UnverifiedAccount;
