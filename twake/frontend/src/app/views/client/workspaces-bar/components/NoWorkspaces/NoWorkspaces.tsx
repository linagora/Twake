import React, { Suspense } from 'react';
import LoginService from 'app/features/auth/login-service';
import Languages from 'app/features/global/services/languages-service';
import CompanySelector, { CurrentCompanyLogo } from '../CompanySelector/index';
import { Button } from 'antd';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import { useCurrentCompany } from 'app/features/companies/hooks/use-companies';
import InitService from 'app/features/global/services/init-service';
import GotALink from './GotALink';

import './styles.scss';

export default () => {
  const retry = () => {
    document.location.reload();
  };
  const { company } = useCurrentCompany();

  return (
    <Suspense fallback={<></>}>
      <div className="welcomePage">
        <div className=" skew_in_top_nobounce">
          <div className="">
            <div className="subtitle">
              <CurrentCompanyLogo />
              {Languages.t('scenes.app.workspaces.welcome_page.added_to_company')}{' '}
              <b>{company?.name}</b>.
              <br />
              {Languages.t('scenes.app.workspaces.welcome_page.no_workspace_subtitle')}
            </div>

            <GotALink />

            <div className="retry">
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a href="#" className="link" onClick={() => retry()}>
                {Languages.t('scenes.app.workspaces.welcome_page.try_again')}
              </a>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a className="blue_link" onClick={() => LoginService.logout()}>
                {Languages.t('scenes.apps.account.account.logout')}
              </a>
            </div>

            <br />
            <br />

            {InitService.server_infos?.configuration?.accounts?.type === 'console' && (
              <ChangeCompany />
            )}
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export const ChangeCompany = () => {
  const { user } = useCurrentUser();

  if (user?.companies?.length === 0) {
    return <></>;
  }

  return (
    <div>
      <CompanySelector>
        <Button type="ghost">
          {Languages.t('scenes.app.workspacesbar.components.change_company_title')}
        </Button>
      </CompanySelector>
    </div>
  );
};
