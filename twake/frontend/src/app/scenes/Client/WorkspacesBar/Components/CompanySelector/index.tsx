import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { capitalize } from 'lodash';

import Menu from 'components/Menus/Menu';
import { addApiUrlIfNeeded } from 'app/services/utils/URLUtils';
import { useCurrentCompany } from 'app/state/recoil/hooks/useCurrentCompany';
import RouterService from 'app/services/RouterService';
import CompanyAPIClient from 'app/services/CompanyAPIClient';
import Groups from 'services/workspaces/groups.js';
import Languages from 'services/languages/languages';

import './styles.scss';
import { CompanyType } from 'app/models/Company';
import useRouterCompany from 'app/state/recoil/hooks/useRouterCompany';

type PropsType = {
  userId: string;
};

type MenuObjectType = { [key: string]: any };

export default ({ userId }: PropsType) => {
  const routerCompanyId = useRouterCompany();
  const [company] = useCurrentCompany();
  const [menu, setMenu] = useState<MenuObjectType[]>([]);

  useEffect(() => {
    buildMenu();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildMenu = async () => {
    const companies = await CompanyAPIClient.listCompanies(userId);

    companies.length > 0 &&
      setMenu([
        {
          type: 'title',
          text: Languages.t(
            'scenes.app.workspacesbar.components.change_company_title',
            [],
            'Change company',
          ),
        },
        ...companies
          .sort((a, b) => a.name.localeCompare(b.name))
          .map<MenuObjectType>(c => ({
            type: 'menu',
            key: c.id,
            text: capitalize(c.name),
            icon: (
              <div
                className={classNames('company-selector-container')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  className={classNames('image', {
                    has_image: !!c.logo,
                  })}
                  style={{
                    backgroundImage: addApiUrlIfNeeded(c.logo, true),
                    color: 'var(--white)',
                    margin: 0,
                  }}
                >
                  {`${c.name}-`[0].toUpperCase()}
                </div>
              </div>
            ),
            onClick: () => {
              RouterService.push(
                RouterService.generateRouteFromState(
                  {
                    companyId: c.id,
                  },
                  { replace: true },
                ),
              );
            },
          })),
      ]);
  };

  return company ? (
    <Menu menu={menu} position="top">
      <div className={classNames('company-selector-container')}>
        <div
          className={classNames('image', {
            has_image: !!company.logo,
          })}
          style={{ backgroundImage: addApiUrlIfNeeded(company.logo, true) }}
        >
          {`${company.name}-`[0].toUpperCase()}
        </div>
        <div className="name">{company.name}</div>
      </div>
    </Menu>
  ) : (
    <></>
  );
};
