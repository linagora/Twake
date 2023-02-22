import { Modal } from 'app/atoms/modal';
import { Info } from 'app/atoms/text';
import Button from 'app/components/buttons/button';
import { useDriveTwakeTab } from 'app/features/drive-twake/hooks/use-drive-twake-tab';
import { useDriveItem } from 'app/features/drive/hooks/use-drive-item';
import { useEffect, useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { EmbedContext } from '.';
import Browser from './browser';
import { SelectorModalAtom } from './modals/selector';

export default ({ context }: { context?: EmbedContext }) => {
  const { tab, setTab, loading } = useDriveTwakeTab(context?.tabId || '');
  const { item, loading: itemLoading } = useDriveItem(tab?.item_id || '');
  const [modifyConfiguration, setModifyConfiguration] = useState(false);
  const setSelectorModalState = useSetRecoilState(SelectorModalAtom);

  if (loading || itemLoading) return <></>;

  // If nothing is configured, then show the selector and when selected the folder will give access to the whole channel
  const modalOpen = !tab || !item || modifyConfiguration;
  const isConfigured = tab && item;

  useEffect(() => {
    if (modalOpen) {
      setSelectorModalState({
        open: true,
        parent_id: 'root',
        mode: 'move',
        title: `Select what folder this tab should display`,
        onSelected: async ids => {
          await setTab(ids[0]);
        },
      });
    }
  }, [modalOpen]);

  // If configured then show the content of the tab and forward the fact that the access is done through a specific channel
  return (
    <div>
      {isConfigured && (
        <Browser
          initialParentId={item.id}
          twakeTabContextToken={context?.channelId + '+' + context?.tabId}
        />
      )}
      {!isConfigured && (
        <div className="w-full text-center">
          <Info>This Documents tabs is not configured yet.</Info>
          <br />
          <Button theme="outlined" className="mt-4" onClick={() => setModifyConfiguration(true)}>
            Configure
          </Button>
        </div>
      )}
    </div>
  );
};
