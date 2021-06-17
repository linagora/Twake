import React from 'react';
import { Typography } from 'antd';
import Banner from '../Banner/Banner';
import { CompanyType } from 'app/models/Company';
import Groups from 'services/workspaces/groups.js';

type PropsType = {
  url: string;
  companyId: string;
};

export default ({ url, companyId }: PropsType): JSX.Element => {
  const { Link } = Typography;
  const userGroups: { [key: string]: CompanyType } = Groups.user_groups;
  const { role, plan } = userGroups[companyId];
  const isCurrentUserAdminOrOwner = role === 'admin' || role === 'owner';
  const billingStatusError = plan?.billing?.status === 'error';

  const onClickLink = () => window.open(url, 'blank');

  const shouldDisplayBanner = isCurrentUserAdminOrOwner && billingStatusError;
  return shouldDisplayBanner ? (
    <Banner type="important">
      Lorem, ipsum dolor sit amet consectetur adipisicing elit. Dolorem dicta nisi assumenda aperiam
      soluta, fugit modi quos quibusdam obcaecati cumque!{' '}
      <Link onClick={onClickLink}>Click here</Link>
    </Banner>
  ) : (
    <></>
  );
};
