import React, { ReactNode } from 'react';
import classNames from 'classnames';
import Menu from 'components/menus/menu';
import { addApiUrlIfNeeded } from 'app/features/global/utils/URLUtils';
import { useCurrentCompany } from 'app/features/companies/hooks/use-companies';
import RouterService from 'app/features/router/services/router-service';
import Languages from 'app/features/global/services/languages-service';
import PopupService from 'app/deprecated/popupManager/popupManager.js';

import './styles.scss';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import {
  useCompanyNotifications,
  useOtherCompanyNotifications,
} from 'app/features/users/hooks/use-notifications';
import menusManager from 'app/components/menus/menus-manager';
import { UserCompanyType } from 'app/features/users/types/user';

type MenuObjectType = { [key: string]: unknown };

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
            type: 'react-element',
            reactElement: (
              <div
                className="company-in-menu menu"
                onClick={() => {
                  PopupService.closeAll();
                  menusManager.closeMenu();
                  RouterService.push(
                    RouterService.generateRouteFromState(
                      {
                        companyId: c.id,
                      },
                      { replace: true },
                    ),
                  );
                }}
                style={{ display: 'flex' }}
              >
                <CompanyInMenu company={c} />
              </div>
            ),
            key: c.id,
          })),
      ]}
      position="top"
    >
      {!children && <CurrentCompanyLogo showBadge withCompanyName={withCompanyName} />}
      {!!children && children}
    </Menu>
  );
};

export const CurrentCompanyLogo = ({
  size,
  withCompanyName = true,
  showBadge = false,
}: {
  size?: number;
  withCompanyName?: boolean;
  showBadge?: boolean;
}) => {
  const { company } = useCurrentCompany();
  const { badges } = useOtherCompanyNotifications(company?.id || '');

  if (!company) {
    return <></>;
  }

  return (
    <div className={classNames('company-selector-container')}>
      {showBadge && badges.length > 0 && <div className="notification_dot" />}

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

const CompanyInMenu = (props: { company: UserCompanyType['company'] }) => {
  const c = props.company;
  const { badges } = useCompanyNotifications(c.id || '');

  return (
    <>
      <div
        className={classNames('company-selector-container')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'start',
          width: '30px',
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

      <span className="text">{c.name}</span>

      {badges.length > 0 && <div className="notification_dot">{Math.max(1, badges.length)}</div>}
    </>
  );
};
