import { Modal } from 'app/atoms/modal';
import { useDriveTwakeTab } from 'app/features/drive-twake/hooks/use-drive-twake-tab';
import { useDriveItem } from 'app/features/drive/hooks/use-drive-item';
import { useState } from 'react';
import { EmbedContext } from '.';

export default ({ context }: { context?: EmbedContext }) => {
  const { tab, setTab, loading } = useDriveTwakeTab(context?.tabId || '');
  const { item, loading: itemLoading } = useDriveItem(tab?.item_id || '');
  const [modifyConfiguration, setModifyConfiguration] = useState(false);

  if (loading || itemLoading) return <></>;

  // If nothing is configured, then show the selector and when selected the folder will give access to the whole channel
  const modalOpen = !tab || !item || modifyConfiguration;

  // If configured then show the content of the tab and forward the fact that the access is done through a specific channel
  return (
    <div>
      <Modal open={modalOpen} onClose={() => {}}></Modal>

      {tab && item && <>TODO: show tab content page</>}
    </div>
  );
};
