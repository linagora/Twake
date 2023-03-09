import { ToasterService } from 'app/features/global/services/toaster-service';
import { LoadingStateInitTrue } from 'app/features/global/state/atoms/Loading';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import { useCallback, useRef } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { DriveItemAtom, DriveItemChildrenAtom } from '../state/store';
import { DriveItem } from '../types';
import { useDriveActions } from './use-drive-actions';
import { useDriveUpload } from './use-drive-upload';
import short from 'short-uuid';

/**
 * Get in store single item and expose methods to operate on it
 * @param id
 * @returns
 */
export const useDriveItem = (id: string) => {
  const companyId = useRouterCompany();
  const item = useRecoilValue(DriveItemAtom(id));
  const children = useRecoilValue(DriveItemChildrenAtom(id));
  const [loading, setLoading] = useRecoilState(LoadingStateInitTrue('useDriveItem-' + id));
  const { refresh: refreshItem, create, update: _update, remove: _remove } = useDriveActions();
  const { uploadVersion: _uploadVersion } = useDriveUpload();

  const refresh = useCallback(
    async (parentId: string) => {
      setLoading(true);
      try {
        await refreshItem(parentId);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, refreshItem],
  );

  const remove = useCallback(async () => {
    setLoading(true);
    try {
      await _remove(id, item?.item?.parent_id || '');
    } catch (e) {
      ToasterService.error('Unable to remove this file.');
    }
    setLoading(false);
  }, [id, setLoading, refresh, item?.item?.parent_id]);

  const update = useCallback(
    async (update: Partial<DriveItem>) => {
      setLoading(true);
      try {
        await _update(update, id, item?.item?.parent_id || '');
      } catch (e) {
        ToasterService.error('Unable to update this file.');
      }
      setLoading(false);
    },
    [id, setLoading, refresh, item?.item?.parent_id],
  );

  const uploadVersion = useCallback(
    async (file: File) => {
      setLoading(true);
      try {
        await _uploadVersion(file, { companyId, id });
      } catch (e) {
        ToasterService.error('Unable to create a new version of this file.');
      }
      setLoading(false);
    },
    [companyId, id, setLoading, refresh, item?.item?.parent_id],
  );

  const inTrash = id === 'trash' || item?.path?.some(i => i.parent_id === 'trash');

  return {
    inTrash,
    loading: loading,
    children: children || [],
    details: item,
    path: item?.path,
    item: item?.item,
    access: item?.access,
    websockets: item?.websockets,
    versions: item?.versions,
    uploadVersion,
    create,
    update,
    remove,
    refresh,
  };
};

const translator = short();
export const getPublicLink = (item?: DriveItem): string => {
  let publicLink = `${document.location.protocol}//${document.location.host}`;
  try {
    publicLink +=
      `/shared/${translator.fromUUID(item?.company_id || '')}` +
      `/drive/${translator.fromUUID(item?.id || '')}` +
      `/t/${item?.access_info?.public?.token}`;
  } catch (e) {
    return publicLink;
  }

  return publicLink;
};
