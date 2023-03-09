/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { v1 as uuid } from 'uuid';

import { FileType, PendingFileType } from 'app/features/files/types/file';
import JWTStorage from 'app/features/auth/jwt-storage-service';
import RouterServices from 'app/features/router/services/router-service';
import Resumable from 'app/features/files/utils/resumable';
import FileUploadAPIClient from '../api/file-upload-api-client';
import { isPendingFileStatusPending } from '../utils/pending-files';
import Logger from 'app/features/global/framework/logger-service';
import _ from 'lodash';
import { MessageFileType } from 'app/features/messages/types/message';
import MessageAPIClient from 'app/features/messages/api/message-api-client';

export enum Events {
  ON_CHANGE = 'notify',
}

const logger = Logger.getLogger('Services/FileUploadService');
class FileUploadService {
  private pendingFiles: PendingFileType[] = [];
  public currentTaskId = '';
  private recoilHandler: Function = () => undefined;

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

  public async upload(
    fileList: File[],
    options?: {
      context?: any;
      callback?: (file: FileType | null, context: any) => void;
    },
  ): Promise<PendingFileType[]> {
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
      const resource = (
        await FileUploadAPIClient.upload(file, { companyId, ...(options?.context || {}) })
      )?.resource;

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

      pendingFile.resumable.on('fileAdded', () => pendingFile.resumable.upload());

      pendingFile.resumable.on('fileProgress', (f: any) => {
        const bytesDelta =
          (f.progress() - pendingFile.progress) * (pendingFile?.originalFile.size || 0);
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

      pendingFile.resumable.on('fileSuccess', (_f: any, message: string) => {
        try {
          pendingFile.backendFile = JSON.parse(message).resource;
          pendingFile.status = 'success';
          console.log('fileSuccess', options?.callback);
          options?.callback?.(pendingFile.backendFile, options?.context || {});
          this.notify();
        } catch (e) {
          logger.error(`Error on fileSuccess Event`, e);
        }
      });

      pendingFile.resumable.on('fileError', () => {
        pendingFile.status = 'error';
        pendingFile.resumable.cancel();
        options?.callback?.(null, options?.context || {});
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

  public async markAsDownloadedFromMessage(messageFile: MessageFileType) {
    await MessageAPIClient.download(messageFile);
  }
}

export default new FileUploadService();
