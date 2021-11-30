import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { capitalize } from 'lodash';

import Menu from 'components/Menus/Menu';
import { addApiUrlIfNeeded } from 'app/services/utils/URLUtils';
import { useCurrentCompany } from 'app/state/recoil/hooks/useCompanies';
import RouterService from 'app/services/RouterService';
import Languages from 'services/languages/languages';
import PopupService from 'services/popupManager/popupManager.js';

import './styles.scss';
import { useCurrentUser } from 'app/state/recoil/hooks/useCurrentUser';

type MenuObjectType = { [key: string]: any };

export default ({ children }: { children?: ReactNode }) => {
  const { user } = useCurrentUser();

  return (
    <Menu
      menu={[
        {
          type: 'title',
          text: Languages.t('scenes.app.workspacesbar.components.change_company_title'),
        },
        ...(user?.companies || [])
          .map(c => c.company)
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
              PopupService.closeAll();
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
      ]}
      position="top"
    >
      {!children && <CurrentCompanyLogo />}
      {!!children && children}
    </Menu>
  );
};

export const CurrentCompanyLogo = () => {
  const { company } = useCurrentCompany();

  if (!company) {
    return <></>;
  }

  return (
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
  );
};
