// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { Suspense, useState } from 'react';
import { Menu } from 'react-feather';
import { Layout } from 'antd';
import classNames from 'classnames';

import Languages from 'services/languages/languages';
import PopupService from 'app/deprecated/popupManager/popupManager.js';
import PopupComponent from 'components/popup-component/popup-component.js';
import MainView from './main-view/MainView';
import DraggableBodyLayer from 'components/draggable/draggable-body-layer.js';
import MenusBodyLayer from 'components/menus/menus-body-layer.js';
import DriveUploadViewer from 'components/uploads/upload-viewer.js';
import ChatUploadsViewer from 'app/components/file-uploads/uploads-viewer';
import ConfigBodyLayer from 'components/configurators/config-body-layer.js';
import Viewer from 'app/views/applications/drive/viewer/viewer';
import ModalComponent from 'app/components/modal/modal-component';
import ConnectionIndicator from 'components/connection-indicator/connection-indicator';
import SearchPopup from 'components/search-popup/search-popup.js';
import NewVersionComponent from 'components/new-version/new-version-component';
import SideBars, { LoadingSidebar } from './side-bars';
import CompanyStatusComponent from 'app/components/on-boarding/company-status-component';
import UserContext from 'app/features/users/state/integration/user-context';
import { useCurrentUser, useCurrentUserRealtime } from 'app/features/users/hooks/use-current-user';
import { useFeatureToggles } from 'app/components/locked-features-components/feature-toggles-hooks';

import './styles.scss';

export default React.memo((): JSX.Element => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { user } = useCurrentUser();
  useCurrentUserRealtime();
  const { FeatureToggles, activeFeatureNames } = useFeatureToggles();

  PopupService.useListener();
  Languages.useListener();

  let page: JSX.Element = <></>;
  if (PopupService.isOpen()) {
    page = <PopupComponent key="PopupComponent" />;
  } else {
    if (user?.id) {
      page = (
        <Layout className="appPage fade_in">
          <NewVersionComponent />
          <CompanyStatusComponent />
          <FeatureToggles features={activeFeatureNames}>
            <Layout hasSider>
              <Layout.Sider
                trigger={<Menu size={16} />}
                breakpoint="lg"
                collapsedWidth="0"
                theme="light"
                width={290}
                onCollapse={(collapsed, type) => {
                  if (type === 'responsive') return setMenuIsOpen(false);
                  setMenuIsOpen(!collapsed);
                }}
              >
                <Suspense fallback={<LoadingSidebar />}>
                  <SideBars />
                </Suspense>
              </Layout.Sider>
              <Suspense fallback={<></>}>
                <MainView className={classNames({ collapsed: menuIsOpen })} />
              </Suspense>
            </Layout>
          </FeatureToggles>
          <UserContext />
        </Layout>
      );
    }
  }

  return (
    <>
      {page}
      <MenusBodyLayer />
      <DraggableBodyLayer />
      <DriveUploadViewer />
      <ConfigBodyLayer />
      <Viewer />
      <ModalComponent />
      <SearchPopup />
      <ConnectionIndicator />
      <ChatUploadsViewer />
    </>
  );
});
