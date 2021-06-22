import React from 'react';
import { Row, Typography } from 'antd';
import Banner from '../Banner/Banner';
import { CompanyType } from 'app/models/Company';
import Groups from 'services/workspaces/groups.js';
import InitService from 'app/services/InitService';
import Languages from 'services/languages/languages.js';
import { AlertTriangle } from 'react-feather';

type PropsType = {
  companyId: string;
};

const { Link } = Typography;
export default ({ companyId }: PropsType): JSX.Element => {
  const companySubscriptionUrl =
    InitService.server_infos?.configuration.accounts.console?.company_subscription_url || '';
  const userGroups: { [key: string]: CompanyType } = Groups.user_groups;
  const { role, plan } = userGroups[companyId];
  const isCurrentUserAdminOrOwner = role === 'admin' || role === 'owner';

  const onClickLink = () => window.open(companySubscriptionUrl, 'blank');

  const shouldDisplayBanner = plan?.billing?.status === 'warning';
  return shouldDisplayBanner ? (
    <Banner type="important">
      <Row align="middle">
        <AlertTriangle size={24} />
        <div className="small-x-margin">
          {Languages.t(
            isCurrentUserAdminOrOwner
              ? 'components.on_boarding.company_billing_banner.admin_or_owner_text'
              : 'components.on_boarding.company_billing_banner.guest_or_member_text',
          )}
        </div>
        {isCurrentUserAdminOrOwner && (
          <Link onClick={onClickLink}>
            {Languages.t('components.on_boarding.company_billing_banner.link')}
          </Link>
        )}
      </Row>
    </Banner>
  ) : (
    <></>
  );
};
