import { FileType, PendingFileStateType, PendingFileType } from 'app/models/File';
import Api from 'app/services/Api';
import JWTStorage from 'app/services/JWTStorage';
import _ from 'lodash';
import { SetterOrUpdater } from 'recoil';
import RouterServices from 'services/RouterService';
import Resumable from 'services/uploadManager/resumable';
import { v1 as uuid } from 'uuid';
type ResponseFileType = { resource: FileType };

export class ChatUploadService {
  private handler: SetterOrUpdater<PendingFileStateType[] | undefined> = () => [];
  private readonly prefixUrl: string = '/internal/services/files/v1';
  private pendingFiles: PendingFileType[] = [];
  public counter: { total: number; completed: number } = { total: 0, completed: 0 };

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor() {}

  public setHandler(handler: SetterOrUpdater<PendingFileStateType[] | undefined>) {
    this.handler = handler;
  }

  private setCounter({ total, completed }: { total: number; completed: number }) {
    this.counter = { total, completed };
  }

  private notify() {
    this.handler(this.pendingFiles.map(f => _.cloneDeep(f.state)));
  }

  // TODO Limit the number of simultaneous requests
  public async upload(fileList: File[]): Promise<void> {
    const { companyId } = RouterServices.getStateFromRoute();

    if (!fileList) return;

    this.setCounter({ total: fileList.length, completed: 0 });

    fileList.forEach(async file => {
      if (!file) return;

      const sharedId = uuid();
      const pendingFile: PendingFileType = {
        id: sharedId,
        tmpFile: file,
        state: {
          id: sharedId,
          file: null,
          status: 'pending',
          progress: 0,
        },
        resumable: null,
      };

      this.pendingFiles.push(pendingFile);

      this.notify();

      // First we create the file object
      const uploadFileRoute = `${this.prefixUrl}/companies/${companyId}/files?filename=${file.name}&type=${file.type}&total_size=${file.size}`;
      const resource = ((await Api.post(uploadFileRoute, undefined)) as ResponseFileType)
        ?.resource as FileType;
      if (!resource) {
        throw new Error('A server error occured');
      }

      pendingFile.state.file = resource;
      this.notify();

      // Then we overwrite the file object with resumable
      pendingFile.resumable = this.getResumableInstance({
        target: Api.route(
          `${this.prefixUrl}/companies/${companyId}/files/${pendingFile.state.file.id}`,
        ),
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
        pendingFile.state.file = f;

        pendingFile.state.progress = f.progress();

        this.notify();
      });

      pendingFile.resumable.on('fileSuccess', (f: any, message: string) => {
        pendingFile.state.file = JSON.parse(message).resource;
        pendingFile.state.status = 'success';

        this.pendingFiles = this.pendingFiles.filter(
          p => p.state.file?.id !== pendingFile.state.file?.id,
        );

        this.notify();

        this.setCounter({ total: this.counter.total, completed: this.counter.completed + 1 });
      });

      pendingFile.resumable.on('fileError', (f: any, message: any) => {
        pendingFile.state.status = 'error';

        pendingFile.resumable.cancel();
        this.pendingFiles = this.pendingFiles.filter(
          p => p.state.file?.id !== pendingFile.state.file?.id,
        );

        this.setCounter({ total: this.counter.total - 1, completed: this.counter.completed });
      });
    });
  }

  public getPendingFile(id: string): PendingFileType {
    return this.pendingFiles.filter(f => f.id === id)[0];
  }

  public cancel(id: string) {
    const fileToCancel = this.pendingFiles.filter(f => f.id === id)[0];

    fileToCancel.resumable.cancel();
    fileToCancel.state.status = 'error';
    this.notify();

    setTimeout(() => {
      this.pendingFiles = this.pendingFiles.filter(f => f.id !== id);
      this.notify();
      this.setCounter({ total: this.counter.total - 1, completed: this.counter.completed });
    }, 1000);
  }

  public pauseOrResume(id: string) {
    const fileToCancel = this.pendingFiles.filter(f => f.id === id)[0];

    fileToCancel.state.status !== 'pause'
      ? (fileToCancel.state.status = 'pause')
      : (fileToCancel.state.status = 'pending');
    fileToCancel.state.status === 'pause'
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

  /** When upload is no longer needed */
  public destroy() {
    //Cancel all current uploads
    //TODO

    //Reset handler to nothing
    this.handler = () => [];
  }
}

export default class ChatUploadServiceManager {
  static instance: ChatUploadService;

  public static get() {
    if (!this.instance) {
      this.instance = new ChatUploadService();
    }

    return this.instance;
  }
}
