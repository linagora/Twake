import { MessageFileType } from 'app/models/Message';
import MessagePendingUploadZonesService, {
  Events as PendingUploadZonesEvents,
} from 'app/services/Apps/Messages/MessagePendingUploadZonesService';
import { useEffect, useRef } from 'react';
import { useRecoilState } from 'recoil';
import { PendingUploadZonesListState } from '../atoms/PendingUploadZonesList';

type handleUploadZonesChangeType = (list: Map<string, MessageFileType[]>) => void;

export const useUploadZones = (zoneId: string) => {
  const [uploadZonesListState, setUploadZonesListState] = useRecoilState(
    PendingUploadZonesListState,
  );

  const handleUploadZonesChange = useRef<handleUploadZonesChangeType>(list => {
    setUploadZonesListState(list);
  });

  useEffect(() => {
    const currentHandleUploadZonesChange = handleUploadZonesChange.current;
    if (currentHandleUploadZonesChange) {
      MessagePendingUploadZonesService.addListener(
        PendingUploadZonesEvents.ON_CHANGE,
        currentHandleUploadZonesChange,
      );
    }

    return () => {
      MessagePendingUploadZonesService.removeListener(
        PendingUploadZonesEvents.ON_CHANGE,
        currentHandleUploadZonesChange,
      );
    };
  }, []);

  let currentUploadZoneFilesList: MessageFileType[] = [];

  if (uploadZonesListState?.get(zoneId)) {
    currentUploadZoneFilesList = uploadZonesListState.get(zoneId) || [];
  }

  const clearZone = (zoneId: string): void => MessagePendingUploadZonesService.clearZone(zoneId);
  return {
    uploadZonesListState,
    currentUploadZoneFilesList,
    clearZone,
  };
};
