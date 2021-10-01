import React from 'react';
import { Button, Row, Typography, Select } from 'antd';
import ObjectModal from '../../ObjectModal/ObjectModal';
import Languages from 'services/languages/languages';
import LoginService from 'app/services/login/LoginService';
import { CompanyType } from 'app/models/Company';
import { capitalize } from 'lodash';
import ModalManager from 'app/components/Modal/ModalManager';
import UserService from 'app/services/user/UserService';
import Groups from 'services/workspaces/groups.js';
import { AlertTriangle } from 'react-feather';
import InitService from 'app/services/InitService';

type SwitchCompanyPropsType = {
  placeholder?: string;
  companiesIds: string[];
};

const { Option } = Select;
const { Text, Title } = Typography;
const SwitchCompany = ({ placeholder, companiesIds }: SwitchCompanyPropsType): JSX.Element => {
  const userGroups: { [key: string]: CompanyType } = Groups.user_groups;
  const companies = companiesIds
    .map(id => userGroups[id])
    .filter(company => company.plan?.billing?.status !== 'error');

  const onSelect = (companyId: string) => {
    Groups.select(userGroups[companyId]);
    return ModalManager.close();
  };

  const onClickBtn = () => LoginService.logout();

  return (
    (!!companies.length && (
      <Select
        placeholder={placeholder || 'Select a company'}
        onSelect={onSelect}
        style={{ width: 224 }}
      >
        {companies.map(company => (
          <Option key={company.id} value={company.id}>
            {capitalize(company.name)}
          </Option>
        ))}
      </Select>
    )) || (
      <Button
        type="primary"
        style={{ height: 36, width: 163, backgroundColor: 'var(--red)' }}
        onClick={onClickBtn}
      >
        {Languages.t('scenes.app.channelsbar.currentuser.logout')}
      </Button>
    )
  );
};

export default (): JSX.Element => {
  const onClickButton = () =>
    window.open(
      InitService.server_infos?.configuration?.accounts?.console?.company_subscription_url || '',
      'blank',
    );

  return (
    <ObjectModal
      title={
        <div style={{ display: 'flex' }}>
          <AlertTriangle size={24} />
          <span className="small-left-margin">
            {Languages.t('components.on_boarding.popups.blocked_company.title')}
          </span>
        </div>
      }
      titleColor="var(--white)"
      titleCenter
      headerStyle={{ backgroundColor: 'var(--red)', color: 'var(--white)', height: 76 }}
      hideFooterDivider
      footerAlign="center"
      footerStyle={{ marginBottom: 24 }}
      footer={
        <Row justify="space-between" align="middle">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Button type="ghost" size="large" onClick={onClickButton}>
              {Languages.t(
                'components.on_boarding.popups.blocked_company.company_subscription_plan_button',
              )}
            </Button>
            <Text style={{ margin: '8px 0 ' }} strong>
              {Languages.t('components.on_boarding.popups.blocked_company.or')}
            </Text>
            <SwitchCompany
              placeholder={Languages.t(
                'components.on_boarding.popups.blocked_company.company_selector',
              )}
              companiesIds={[...UserService.getCurrentUser()?.groups_id || []]}
            />
          </div>
        </Row>
      }
    >
      <Row justify="center" style={{ marginTop: 36 }}>
        <Title
          level={3}
          style={{
            textAlign: 'center',
            margin: 0,
            width: 493,
          }}
        >
          {Languages.t('components.on_boarding.popups.blocked_company.description')}
        </Title>
      </Row>

      <Row justify="center" style={{ marginTop: 32, marginBottom: 8 }}>
        <Text
          style={{
            textAlign: 'center',
            fontSize: 15,
            height: '22px',
          }}
        >
          {Languages.t('components.on_boarding.popups.blocked_company.learn_more_text')}
        </Text>
      </Row>
    </ObjectModal>
  );
};
