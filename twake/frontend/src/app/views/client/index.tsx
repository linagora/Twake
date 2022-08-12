// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { Suspense, useState } from 'react';
import { Menu } from 'react-feather';
import { Layout } from 'antd';
import classNames from 'classnames';

import Languages from 'app/features/global/services/languages-service';
import PopupService from 'app/deprecated/popupManager/popupManager.js';
import PopupComponent from 'components/popup-component/popup-component.js';
import MainView from './main-view/MainView';
import DraggableBodyLayer from 'components/draggable/draggable-body-layer.js';
import MenusBodyLayer from 'components/menus/menus-body-layer.js';
import DriveUploadViewer from 'components/uploads/upload-viewer.js';
import ChatUploadsViewer from 'app/components/file-uploads/uploads-viewer';
import ConfigBodyLayer from 'components/configurators/config-body-layer.js';
import DriveViewer from 'app/views/applications/drive/viewer/drive-deprecated-viewer';
import Viewer from 'app/views/applications/viewer/viewer';
import ModalComponent from 'app/components/modal/modal-component';
import ConnectionIndicator from 'components/connection-indicator/connection-indicator';
import SearchPopup from 'components/search-popup/search-popup';
import NewVersionComponent from 'components/new-version/new-version-component';
import SideBars, { LoadingSidebar } from './side-bars';
import CompanyStatusComponent from 'app/components/on-boarding/company-status-component';
import UserContext from 'app/features/users/state/integration/user-context';
import { useCurrentUser, useCurrentUserRealtime } from 'app/features/users/hooks/use-current-user';
import { useFeatureToggles } from 'app/components/locked-features-components/feature-toggles-hooks';
import useUsetiful from 'app/features/global/hooks/use-usetiful';
import UsersSearchModal from 'app/components/channel-members-list/users-search-modal';

import './styles.scss';
import DownloadAppBanner from 'app/components/download-app-banner/download-app-banner';
import ChannelAttachementList from 'app/components/channel-attachement-list/channel-attachement-list';

export default React.memo((): JSX.Element => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { user } = useCurrentUser();
  useCurrentUserRealtime();
  const { FeatureToggles, activeFeatureNames } = useFeatureToggles();

  useUsetiful();

  PopupService.useListener();
  Languages.useListener();

  let page: JSX.Element = <></>;

  if (user?.id) {
    page = (
      <Layout className="appPage fade_in">
        <DownloadAppBanner />
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

  return (
    <>
      {PopupService.isOpen() && <PopupComponent key="PopupComponent" />}
      {page}
      <MenusBodyLayer />
      <DraggableBodyLayer />
      <DriveUploadViewer />
      <ConfigBodyLayer />
      <Viewer />
      <DriveViewer />
      <ModalComponent />
      <SearchPopup />
      <ChannelAttachementList />
      <ConnectionIndicator />
      <ChatUploadsViewer />
      <UsersSearchModal />
    </>
  );
});
