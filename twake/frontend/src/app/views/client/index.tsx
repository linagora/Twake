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
import { MainHeader } from './header';
import { WorkspaceSelector } from './workspace-selector';
import ReactDOM from 'react-dom';

export default React.memo((): JSX.Element => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { user } = useCurrentUser();
  useCurrentUserRealtime();
  const { FeatureToggles, activeFeatureNames } = useFeatureToggles();
  const [collapsed, setCollapsed] = useState(false);

  useUsetiful();

  PopupService.useListener();
  Languages.useListener();

  let page: JSX.Element = <></>;

  if (user?.id) {
    page = (
      <Layout className="app_page fade_in">
        <DownloadAppBanner />
        <NewVersionComponent />
        <CompanyStatusComponent />
        <Layout.Header className="bg-white dark:bg-zinc-700 !p-0 !h-auto">
          <MainHeader />
        </Layout.Header>
        <FeatureToggles features={activeFeatureNames}>
          <Layout hasSider className="p-1 sm:p-2 bg-zinc-200 dark:bg-zinc-900">
            <Layout.Sider
              trigger={ReactDOM.createPortal(
                <div className="flex items-center justify-center absolute w-16 h-16 left-0 top-0 z-10 bg-white dark:bg-zinc-700 cursor-pointer text-zinc-800 dark:text-white hover:text-blue-500">
                  <Menu size={16} />
                </div>,
                (window as any).document.body,
              )}
              breakpoint="md"
              collapsedWidth="0"
              theme="light"
              width={320}
              className="bg-transparent overflow-hidden"
              collapsed={collapsed}
              onCollapse={(collapsed, type) => {
                setCollapsed(collapsed);
                if (type === 'responsive') return setMenuIsOpen(false);
                setMenuIsOpen(!collapsed);
              }}
            >
              <div className="flex flex-col overflow-hidden h-full w-full pr-1 sm:pr-2">
                <WorkspaceSelector />
                <div className="grow overflow-hidden bg-white dark:bg-zinc-700 rounded-lg p-3">
                  <Suspense fallback={<LoadingSidebar />}>
                    <SideBars />
                  </Suspense>
                </div>
              </div>
            </Layout.Sider>
            <Suspense fallback={<></>}>
              <MainView
                onClick={() => {
                  if (menuIsOpen) setCollapsed(true);
                }}
                className={
                  ' transition-opacity overflow-hidden rounded-lg ' +
                  classNames({
                    'collapsed opacity-50': menuIsOpen,
                  })
                }
              />
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
