import { useGlobalEffect } from 'app/features/global/hooks/use-global-effect';
import { ToasterService } from 'app/features/global/services/toaster-service';
import { LoadingState } from 'app/features/global/state/atoms/Loading';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import { useCallback } from 'react';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import { DriveApiClient } from '../api-client/api-client';
import { DriveItemAtom, DriveItemChildrenAtom } from '../state/store';
import { DriveItem, DriveItemVersion } from '../types';

/**
 * Returns the children of a drive item
 * @param id
 * @returns
 */
export const useDriveChildren = (id: string | 'trash' | 'root' = 'root') => {
  const companyId = useRouterCompany();
  const [loading, setLoading] = useRecoilState(LoadingState('useDriveChildren-' + id));
  const children = useRecoilValue(DriveItemChildrenAtom(id));

  const refresh = useRecoilCallback(
    ({ set, snapshot }) =>
      async () => {
        setLoading(true);
        try {
          const details = await DriveApiClient.get(companyId, id);
          set(DriveItemChildrenAtom(id), details.children);
          set(DriveItemAtom(id), details);
          for (const child of details.children) {
            const currentValue = snapshot.getLoadable(DriveItemAtom(child.id)).contents;
            set(DriveItemAtom(child.id), { ...currentValue, item: child });
          }
          setLoading(false);
          return details;
        } catch (e) {
          ToasterService.error('Unable to load your files.');
        }
        setLoading(false);
      },
    [companyId, id, setLoading],
  );

  const create = useCallback(
    async (item: Partial<DriveItem>, version: Partial<DriveItemVersion>) => {
      let driveFile = null;
      if (!item.company_id) item.company_id = companyId;
      setLoading(true);
      try {
        driveFile = await DriveApiClient.create(companyId, { item, version });
        await refresh();
      } catch (e) {
        ToasterService.error('Unable to create a new file.');
      }
      setLoading(false);
      return driveFile;
    },
    [id, setLoading, refresh],
  );

  return { loading, create, children, refresh };
};
