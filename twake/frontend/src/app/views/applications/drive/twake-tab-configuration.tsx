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
  const { tab, setTab, loading } = useDriveTwakeTab(context?.channelId || '', context?.tabId || '');
  const { item, loading: itemLoading, refresh } = useDriveItem(tab?.item_id || '');
  const setSelectorModalState = useSetRecoilState(SelectorModalAtom);

  useEffect(() => {
    if (tab?.item_id) refresh(tab!.item_id);
  }, [tab?.item_id, refresh]);

  // If nothing is configured, then show the selector and when selected the folder will give access to the whole channel
  const modalOpen = (!tab || !item) && !loading && !itemLoading;
  const isConfigured = tab && item;

  useEffect(() => {
    if (modalOpen) {
      setSelectorModalState({
        open: true,
        parent_id: 'root',
        mode: 'move',
        title: `Select what folder this tab should display`,
        onSelected: async ids => {
          await setTab(ids[0], 'write');
        },
      });
    }
  }, [modalOpen]);

  if (!item && !tab) return <></>;

  // If configured then show the content of the tab and forward the fact that the access is done through a specific channel
  return (
    <div>
      {isConfigured && (
        <Browser
          initialParentId={item.id}
          twakeTabContextToken={context?.channelId + '+' + context?.tabId}
        />
      )}
      {!isConfigured && !loading && !(tab?.item_id && itemLoading) && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <Info>This Documents tabs is not configured yet.</Info>
            <br />
            <Button
              theme="outlined"
              className="mt-4"
              onClick={() =>
                setSelectorModalState({
                  open: true,
                  parent_id: 'root',
                  mode: 'move',
                  title: `Select what folder this tab should display`,
                  onSelected: async ids => {
                    await setTab(ids[0], 'write');
                  },
                })
              }
            >
              Configure
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
