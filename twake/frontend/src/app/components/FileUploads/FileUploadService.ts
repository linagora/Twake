import { PendingFileType } from 'app/models/File';
import JWTStorage from 'app/services/JWTStorage';
import EventEmitter from 'events';
import RouterServices from 'services/RouterService';
import Resumable from 'services/uploadManager/resumable';
import { v1 as uuid } from 'uuid';
import FileUploadAPIClient from './FileUploadAPIClient';
import { isPendingFileStatusPending } from './utils/PendingFiles';

export enum Events {
  ON_CHANGE = 'onChange',
}

export class FileUploadService extends EventEmitter {
  private pendingFiles: PendingFileType[] = [];
  public currentTaskId: string = '';

  onChange() {
    this.emit(Events.ON_CHANGE, this.pendingFiles);
  }

  public async upload(fileList: File[]): Promise<void> {
    const { companyId } = RouterServices.getStateFromRoute();

    if (!fileList || !companyId) return;

    if (!this.pendingFiles.some(f => isPendingFileStatusPending(f.status))) {
      //New upload task when all previous task is finished
      this.currentTaskId = uuid();
    }

    fileList.forEach(async file => {
      if (!file) return;

      const pendingFile: PendingFileType = {
        id: uuid(),
        status: 'pending',
        progress: 0,
        uploadTaskId: this.currentTaskId,
        originalFile: file,
        backendFile: null,
        resumable: null,
      };

      this.pendingFiles.push(pendingFile);

      this.onChange();

      // First we create the file object
      const resource = (await FileUploadAPIClient.upload(file, { companyId }))?.resource;

      if (!resource) {
        throw new Error('A server error occured');
      }

      pendingFile.backendFile = resource;
      this.onChange();

      // Then we overwrite the file object with resumable
      pendingFile.resumable = this.getResumableInstance({
        target: FileUploadAPIClient.getRoute({
          companyId,
          fileId: pendingFile.backendFile.id,
          fullApiRouteUrl: true,
        }),
        query: {
          thumbnail_sync: 1,
        },
        headers: {
          Authorization: JWTStorage.getAutorizationHeader(),
        },
      });

      pendingFile.resumable.addFile(file);

      pendingFile.resumable.on('fileAdded', (f: any, message: any) =>
        pendingFile.resumable.upload(),
      );

      pendingFile.resumable.on('fileProgress', (f: any, ratio: number) => {
        pendingFile.backendFile = f;
        pendingFile.progress = f.progress();
        this.onChange();
      });

      pendingFile.resumable.on('fileSuccess', (f: any, message: string) => {
        try {
          pendingFile.backendFile = JSON.parse(message).resource;
          pendingFile.status = 'success';
          this.onChange();
        } catch (e) {
          console.error(e);
        }
      });

      pendingFile.resumable.on('fileError', (f: any, message: any) => {
        pendingFile.status = 'error';
        pendingFile.resumable.cancel();
        this.onChange();
      });
    });
  }

  public getPendingFile(id: string): PendingFileType {
    return this.pendingFiles.filter(f => f.id === id)[0];
  }

  public cancel(id: string, timeout = 1000) {
    const fileToCancel = this.pendingFiles.filter(f => f.id === id)[0];

    //TODO delete file
    fileToCancel.resumable.cancel();
    fileToCancel.status = 'error';
    this.onChange();

    setTimeout(() => {
      this.pendingFiles = this.pendingFiles.filter(f => f.id !== id);
      this.onChange();
    }, timeout);
  }

  public pauseOrResume(id: string) {
    const fileToCancel = this.pendingFiles.filter(f => f.id === id)[0];

    fileToCancel.status !== 'pause'
      ? (fileToCancel.status = 'pause')
      : (fileToCancel.status = 'pending');
    fileToCancel.status === 'pause'
      ? fileToCancel.resumable.pause()
      : fileToCancel.resumable.upload();

    this.onChange();
  }

  private getResumableInstance({
    target,
    headers,
    chunkSize,
    testChunks,
    simultaneousUploads,
    maxChunkRetries,
    query,
  }: {
    target: string;
    headers: { Authorization: string };
    chunkSize?: number;
    testChunks?: number;
    simultaneousUploads?: number;
    maxChunkRetries?: number;
    query?: { [key: string]: any };
  }) {
    return new Resumable({
      target,
      headers,
      chunkSize: chunkSize || 50000000,
      testChunks: testChunks || false,
      simultaneousUploads: simultaneousUploads || 5,
      maxChunkRetries: maxChunkRetries || 2,
      query,
    });
  }
}

export default new FileUploadService();
