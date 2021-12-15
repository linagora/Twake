import { v1 as uuid } from 'uuid';
import EventEmitter from 'events';

import { FileType, PendingFileType } from 'app/models/File';
import JWTStorage from 'app/services/JWTStorage';
import RouterServices from 'services/RouterService';
import Resumable from 'services/uploadManager/resumable';
import FileUploadAPIClient from './FileUploadAPIClient';
import { isPendingFileStatusPending } from './utils/PendingFiles';
import Logger from 'app/services/Logger';
import _ from 'lodash';

export enum Events {
  ON_CHANGE = 'notify',
}

const logger = Logger.getLogger('Services/FileUploadService');
class FileUploadService {
  private pendingFiles: PendingFileType[] = [];
  public currentTaskId: string = '';
  private recoilHandler: Function = () => {};

  setRecoilHandler(handler: Function) {
    this.recoilHandler = handler;
  }

  notify() {
    const updatedState = this.pendingFiles.map((f: PendingFileType) => {
      return {
        id: f.id,
        status: f.status,
        progress: f.progress,
        file: f.backendFile,
      };
    });
    this.recoilHandler(_.cloneDeep(updatedState));
  }

  public async upload(fileList: File[]): Promise<PendingFileType[]> {
    const { companyId } = RouterServices.getStateFromRoute();

    if (!fileList || !companyId) {
      logger.log('FileList or companyId is undefined', [fileList, companyId]);
      return [];
    }

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
        lastProgress: new Date().getTime(),
        speed: 0,
        uploadTaskId: this.currentTaskId,
        originalFile: file,
        backendFile: null,
        resumable: null,
      };

      this.pendingFiles.push(pendingFile);

      this.notify();

      // First we create the file object
      const resource = (await FileUploadAPIClient.upload(file, { companyId }))?.resource;

      if (!resource) {
        throw new Error('A server error occured');
      }

      pendingFile.backendFile = resource;
      this.notify();

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
        const bytesDelta = (f.progress() - pendingFile.progress) * pendingFile.originalFile.size;
        const timeDelta = new Date().getTime() - pendingFile.lastProgress;

        // To avoid jumping time ?
        if (timeDelta > 1000) {
          pendingFile.speed = bytesDelta / timeDelta;
        }

        pendingFile.backendFile = f;
        pendingFile.lastProgress = new Date().getTime();
        pendingFile.progress = f.progress();
        this.notify();
      });

      pendingFile.resumable.on('fileSuccess', (f: any, message: string) => {
        try {
          pendingFile.backendFile = JSON.parse(message).resource;
          pendingFile.status = 'success';
          this.notify();
        } catch (e) {
          logger.error(`Error on fileSuccess Event`, e);
        }
      });

      pendingFile.resumable.on('fileError', (f: any, message: any) => {
        pendingFile.status = 'error';
        pendingFile.resumable.cancel();
        this.notify();
      });
    });

    return this.pendingFiles.filter(f => f.uploadTaskId === this.currentTaskId);
  }

  public async getFile({
    companyId,
    fileId,
  }: {
    fileId: string;
    companyId: string;
  }): Promise<FileType> {
    return _.cloneDeep((await FileUploadAPIClient.get({ fileId, companyId }))?.resource);
  }

  public getPendingFile(id: string): PendingFileType {
    return this.pendingFiles.filter(f => f.id === id)[0];
  }

  public getPendingFileByBackendId(id: string): PendingFileType {
    return this.pendingFiles.filter(f => f.backendFile?.id && f.backendFile.id === id)[0];
  }

  public cancel(id: string, timeout = 1000) {
    const fileToCancel = this.pendingFiles.filter(f => f.id === id)[0];

    fileToCancel.status = 'cancel';
    fileToCancel.resumable.cancel();
    this.notify();

    if (fileToCancel.backendFile)
      this.deleteOneFile({
        companyId: fileToCancel.backendFile.company_id,
        fileId: fileToCancel.backendFile.id,
      });

    setTimeout(() => {
      this.pendingFiles = this.pendingFiles.filter(f => f.id !== id);
      this.notify();
    }, timeout);
  }

  public retry(id: string) {
    const fileToRetry = this.pendingFiles.filter(f => f.id === id)[0];

    if (fileToRetry.status === 'error') {
      fileToRetry.status = 'pending';
      fileToRetry.resumable.upload();

      this.notify();
    }
  }

  public pauseOrResume(id: string) {
    const fileToCancel = this.pendingFiles.filter(f => f.id === id)[0];

    fileToCancel.status !== 'pause'
      ? (fileToCancel.status = 'pause')
      : (fileToCancel.status = 'pending');
    fileToCancel.status === 'pause'
      ? fileToCancel.resumable.pause()
      : fileToCancel.resumable.upload();

    this.notify();
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

  public async deleteOneFile({
    companyId,
    fileId,
  }: {
    companyId: string;
    fileId: string;
  }): Promise<void> {
    const response = await FileUploadAPIClient.delete({ companyId, fileId });

    if (response.status === 'success') {
      this.pendingFiles = this.pendingFiles.filter(f => f.backendFile?.id !== fileId);
      this.notify();
    } else {
      logger.error(`Error while processing delete for file`, fileId);
    }
  }

  public download({ companyId, fileId }: { companyId: string; fileId: string }): Promise<Blob> {
    return FileUploadAPIClient.download({
      companyId: companyId,
      fileId: fileId,
    });
  }

  public getDownloadRoute({ companyId, fileId }: { companyId: string; fileId: string }): string {
    return FileUploadAPIClient.getDownloadRoute({
      companyId: companyId,
      fileId: fileId,
    });
  }
}

export default new FileUploadService();
