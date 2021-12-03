import EventEmitter from 'events';
import RouterServices from 'services/RouterService';

import Logger from 'app/services/Logger';
import FileUploadService from 'app/components/FileUploads/FileUploadService';
import { MessageFileType } from 'app/models/Message';

export enum Events {
  ON_CHANGE = 'onChange',
}

const logger = Logger.getLogger('Services/PendingUploadZonesService');
class PendingUploadZonesService extends EventEmitter {
  list: Map<string, MessageFileType[]> = new Map<string, MessageFileType[]>();

  onChange() {
    this.emit(Events.ON_CHANGE, this.list);
  }

  async add(zoneId: string, file: MessageFileType): Promise<void> {
    const { companyId } = RouterServices.getStateFromRoute();

    try {
      if (!companyId) {
        return logger.error(`Error while trying to add new zone because companyId is`, companyId);
      }

      this.list.get(zoneId)?.push(file);
      this.onChange();
    } catch (e) {
      logger.error('Error while trying to add new zone', e);
    }
  }

  async upload(zoneId: string, fileList: File[]): Promise<void> {
    try {
      // We upload files
      const newFiles = await FileUploadService.upload(fileList);

      // Then, we set the list
      this.list.set(zoneId, [
        ...(this.list.get(zoneId) || []),
        ...newFiles.map(f => {
          return {
            metadata: {
              source: 'pending',
              external_id: f.id,
            },
          };
        }),
      ]);
      this.onChange();
    } catch (e) {
      logger.error('Error while trying to add new zone and upload files', e);
    }
  }

  clearZone(zoneId: string): void {
    this.list.set(zoneId, []);
    this.onChange();
  }
}

export default new PendingUploadZonesService();
