import { Button, Row, Select, Typography } from 'antd';
import menusManager from 'app/components/menus/menus-manager';
import ModalManager from 'app/components/modal/modal-manager';
import PopupService from 'app/deprecated/popupManager/popupManager.js';
import LoginService from 'app/features/auth/login-service';
import { useCompanies } from 'app/features/companies/hooks/use-companies';
import consoleService from 'app/features/console/services/console-service';
import Languages from 'app/features/global/services/languages-service';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import RouterService from 'app/features/router/services/router-service';
import UserService from 'app/features/users/services/current-user-service';
import { capitalize } from 'lodash';
import { AlertTriangle } from 'react-feather';
import ObjectModal from '../../object-modal/object-modal';

type SwitchCompanyPropsType = {
  placeholder?: string;
  companiesIds: string[];
};

const { Option } = Select;
const { Text, Title } = Typography;
const SwitchCompany = ({ placeholder, companiesIds }: SwitchCompanyPropsType): JSX.Element => {
  const { companies: _companies } = useCompanies();
  const companies = _companies.filter(company => company.company.plan?.billing?.status !== 'error');

  const onSelect = (companyId: string) => {
    PopupService.closeAll();
    menusManager.closeMenu();
    RouterService.push(
      RouterService.generateRouteFromState(
        {
          companyId,
        },
        { replace: true },
      ),
    );
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
          <Option key={company.company.id} value={company.company.id}>
            {capitalize(company.company.name)}
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
  const companyId = useRouterCompany();
  const onClickButton = () =>
    window.open(consoleService.getCompanySubscriptionUrl(companyId), 'blank');

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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: 32,
            }}
          >
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
              companiesIds={[...(UserService.getCurrentUser()?.groups_id || [])]}
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
