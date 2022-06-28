import React from 'react';
import { Title } from '../../atoms/text';
import { Button } from '../../atoms/button/button';
import { X } from 'react-feather';
import InitService from '../../features/global/services/init-service';
import LocalStorage from '../../features/global/framework/local-storage-service';

export default (): React.ReactElement => {
  const download = (): void => {
    const appDownloadUrl = InitService?.server_infos?.configuration?.app_download_url;

    if (appDownloadUrl) {
      window.open(appDownloadUrl, '_blank');
    }
  };

  const removeBanner = (): void => {
    LocalStorage.setItem('show_app_banner', 'false');
  }

  return (
    <div className="bg-linear-purple h-[72px] w-full hidden sm:block">
      <div className="flex items-center justify-center h-full space-x-4 pr-4">
        <Title className="text-right basis-3/5 !text-white">
          Get the most out of twake, download the desktop app now
        </Title>
        <Button theme="secondary" onClick={() => download()}>
          Download desktop app
        </Button>
        <div className="grow items-end">
          <X className="text-2xl float-right text-white" onClick={() => removeBanner()} />
        </div>
      </div>
    </div>
  );
};
