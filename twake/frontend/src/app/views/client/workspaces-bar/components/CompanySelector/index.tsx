import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { capitalize } from 'lodash';

import Menu from 'components/menus/menu';
import { addApiUrlIfNeeded } from 'app/services/utils/URLUtils';
import { useCurrentCompany } from 'app/features/companies/hooks/use-companies';
import RouterService from 'app/features/router/services/router-service';
import Languages from 'services/languages/languages';
import PopupService from 'app/deprecated/popupManager/popupManager.js';

import './styles.scss';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';

type MenuObjectType = { [key: string]: any };

export default ({
  children,
  withCompanyName = true,
}: {
  children?: ReactNode;
  withCompanyName?: boolean;
}) => {
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
      {!children && <CurrentCompanyLogo withCompanyName={withCompanyName} />}
      {!!children && children}
    </Menu>
  );
};

export const CurrentCompanyLogo = ({
  size,
  withCompanyName = true,
}: {
  size?: number;
  withCompanyName?: boolean;
}) => {
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
        style={{
          backgroundImage: addApiUrlIfNeeded(company.logo, true),
          width: size,
          height: size,
        }}
      >
        {`${company.name}-`[0].toUpperCase()}
      </div>
      {withCompanyName ? <div className="name">{company.name}</div> : <></>}
    </div>
  );
};
