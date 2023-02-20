import { Transition } from '@headlessui/react';
import { DownloadIcon, XIcon } from '@heroicons/react/outline';
import { Modal } from 'app/atoms/modal';
import {
  useDrivePreview,
  useDrivePreviewDisplayData,
  useDrivePreviewLoading,
} from 'app/features/drive/hooks/use-drive-preview';
import { addShortcut, removeShortcut } from 'app/features/global/services/shortcut-service';
import { useEffect, useState } from 'react';
import { fadeTransition } from 'src/utils/transitions';
import * as Text from '@atoms/text';
import { formatDate } from 'app/features/global/utils/format-date';
import { formatSize } from 'app/features/global/utils/format-file-size';
import { Button } from 'app/atoms/button/button';
import DriveDisplay from './drive-display';
import { Loader } from 'app/atoms/loader';

export const DrivePreview = (): React.ReactElement => {
  const { isOpen, close, loading } = useDrivePreview();
  const [modalLoading, setModalLoading] = useState(true);
  const { loading: loadingData } = useDrivePreviewLoading();
  let animationTimeout: number = setTimeout(() => undefined);

  useEffect(() => {
    addShortcut({ shortcut: 'esc', handler: close });

    return () => {
      removeShortcut({ shortcut: 'esc', handler: close });
    };
  }, []);

  useEffect(() => {
    clearTimeout(animationTimeout);

    if (loading) {
      animationTimeout = window.setTimeout(() => {
        setModalLoading(false);
      }, 400);
    }
  }, [loading]);

  return (
    <Modal
      open={isOpen}
      closable={false}
      className="bg-black bg-opacity-50 !sm:max-w-none !w-full !rounded-none !p-0"
      style={{ maxWidth: 'none', margin: 0, left: 0, top: 0, height: '100vh' }}
      positioned={false}
    >
      <XIcon
        className="z-10 cursor-pointer absolute right-5 top-5 w-12 h-12 text-zinc-300 hover:text-white rounded-full p-1 hover:bg-black hover:bg-opacity-25"
        onClick={() => close()}
      />

      <Transition
        show={modalLoading || loadingData}
        as="div"
        className="absolute m-auto w-8 h-8 left-0 right-0 top-0 bottom-0"
        {...fadeTransition}
      >
        <Loader className="w-8 h-8 text-white" />
      </Transition>

      <Transition
        show={!modalLoading}
        as="div"
        className="flex flex-col h-full"
        {...fadeTransition}
      >
        <div className="px-16 py-2 grow relative overflow-hidden">
          <DriveDisplay />
        </div>
        <Footer />
      </Transition>
    </Modal>
  );
};

const Footer = (): React.ReactElement => {
  const { status } = useDrivePreview();
  const { download, extension } = useDrivePreviewDisplayData();

  const name = status.details?.item.name;

  return (
    <>
      <div className="z-10 p-5 bg-black w-full flex text-white">
        <div className="grow overflow-hidden text-ellipsis">
          <Text.Base noColor className="w-full block text-white whitespace-nowrap">
            {name}
          </Text.Base>
          <Text.Info className="whitespace-nowrap">
            {formatDate(
              +(status.details?.item.added || '') ||
                status.details?.item.last_version_cache.date_added,
            )}{' '}
            • {extension?.toLocaleUpperCase()},{' '}
            {formatSize(
              status.details?.item.last_version_cache.file_metadata.size ||
                status.details?.item.size,
            )}
          </Text.Info>
        </div>
        <div className="whitespace-nowrap">
          {/* controls here */}
          <Button
            iconSize="lg"
            className="ml-4 !rounded-full"
            theme="dark"
            size="lg"
            icon={DownloadIcon}
            onClick={() => {
              download && (window.location.href = download);
            }}
          />
        </div>
      </div>
    </>
  );
};
