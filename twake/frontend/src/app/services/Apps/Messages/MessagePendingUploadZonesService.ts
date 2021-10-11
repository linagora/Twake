import FileUploadService from 'app/components/FileUploads/FileUploadService';
import EventEmitter from 'events';

export enum Events {
  ON_CHANGE = 'onChange',
}

class PendingUploadZonesService extends EventEmitter {
  list: Map<string, string[]> = new Map<string, string[]>();

  onChange() {
    this.emit(Events.ON_CHANGE, this.list);
  }

  async add(zoneId: string, fileList: File[]): Promise<void> {
    try {
      // Then we upload files
      const oldFiles = this.list.get(zoneId) || [];
      const newFiles = await FileUploadService.upload(fileList);

      // Finally, we set the list
      this.list.set(zoneId, [...oldFiles, ...newFiles.map(f => f.id)]);
      this.onChange();
    } catch (e) {
      console.error(e);
    }
  }

  clearZone(zoneId: string): void {
    this.list.set(zoneId, []);
    this.onChange();
  }
}

export default new PendingUploadZonesService();
