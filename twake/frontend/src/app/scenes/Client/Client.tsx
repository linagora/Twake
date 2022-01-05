// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { Suspense, useState } from 'react';
import { Menu } from 'react-feather';
import { Layout } from 'antd';
import classNames from 'classnames';

import Languages from 'services/languages/languages';
import PopupService from 'services/popupManager/popupManager.js';
import PopupComponent from 'components/PopupComponent/PopupComponent.js';
import MainView from './MainView/MainView';
import DraggableBodyLayer from 'components/Draggable/DraggableBodyLayer.js';
import MenusBodyLayer from 'components/Menus/MenusBodyLayer.js';
import DriveUploadViewer from 'components/Uploads/UploadViewer.js';
import ChatUploadsViewer from 'app/components/FileUploads/UploadsViewer';
import ConfigBodyLayer from 'components/Configurators/ConfigBodyLayer.js';
import Viewer from 'scenes/Apps/Drive/Viewer/Viewer';
import ModalComponent from 'app/components/Modal/ModalComponent';
import ConnectionIndicator from 'components/ConnectionIndicator/ConnectionIndicator';
import SearchPopup from 'components/SearchPopup/SearchPopup.js';
import NewVersionComponent from 'components/NewVersion/NewVersionComponent';
import SideBars, { LoadingSidebar } from './SideBars';
import CompanyStatusComponent from 'app/components/OnBoarding/CompanyStatusComponent';
import UserContext from 'app/state/recoil/integration/UserContext';
import { useCurrentUser, useCurrentUserRealtime } from 'app/state/recoil/hooks/useCurrentUser';
import { useFeatureToggles } from 'app/components/LockedFeaturesComponents/FeatureTogglesHooks';

import './Client.scss';

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
