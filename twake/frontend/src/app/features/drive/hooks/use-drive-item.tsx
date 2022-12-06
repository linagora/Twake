import { ToasterService } from 'app/features/global/services/toaster-service';
import { LoadingState } from 'app/features/global/state/atoms/Loading';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import { useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { DriveApiClient } from '../api-client/api-client';
import { DriveItemAtom } from '../state/store';
import { DriveItem, DriveItemVersion } from '../types';
import { useDriveChildren } from './use-drive-children';

/**
 * Get in store single item and expose methods to operate on it
 * @param id
 * @returns
 */
export const useDriveItem = (id: string) => {
  const companyId = useRouterCompany();
  const item = useRecoilValue(DriveItemAtom(id));
  const [loading, setLoading] = useRecoilState(LoadingState('useDriveItem-' + id));
  const { refresh } = useDriveChildren(id);

  const remove = useCallback(async () => {
    setLoading(true);
    try {
      await DriveApiClient.remove(companyId, id);
      await refresh();
    } catch (e) {
      ToasterService.error('Unable to remove this file.');
    }
    setLoading(false);
  }, [id, setLoading, refresh]);

  const update = useCallback(
    async (update: Partial<DriveItem>) => {
      setLoading(true);
      try {
        await DriveApiClient.update(companyId, id, update);
        await refresh();
      } catch (e) {
        ToasterService.error('Unable to update this file.');
      }
      setLoading(false);
    },
    [id, setLoading, refresh],
  );

  const createVersion = useCallback(
    async (version: Partial<DriveItemVersion>) => {
      setLoading(true);
      try {
        await DriveApiClient.createVersion(companyId, id, version);
        await refresh();
      } catch (e) {
        ToasterService.error('Unable to create a new version of this file.');
      }
      setLoading(false);
    },
    [id, setLoading, refresh],
  );

  return {
    loading,
    item: item?.item,
    versions: item?.versions,
    createVersion,
    update,
    remove,
    refresh,
  };
};
