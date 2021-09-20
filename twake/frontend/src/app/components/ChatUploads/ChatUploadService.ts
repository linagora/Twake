import { FileType, PendingFileType } from 'app/models/File';
import Api from 'app/services/Api';
import JWTStorage from 'app/services/JWTStorage';
import { SetterOrUpdater } from 'recoil';
import RouterServices from 'services/RouterService';
import Resumable from 'services/uploadManager/resumable';

type ResponseFileType = { resource: FileType };

export default class ChatUploadService {
  private handler: SetterOrUpdater<PendingFileType[] | undefined> = () => [];

  prefixUrl: string = '/internal/services/files/v1';

  pendingFiles: PendingFileType[] = [];

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor() {}

  public setHandler(handler: SetterOrUpdater<PendingFileType[] | undefined>) {
    this.handler = handler;
  }

  public async upload(fileList: File[]): Promise<void> {
    const { companyId } = RouterServices.getStateFromRoute();

    const file: File | undefined = fileList[0];

    if (!file) return;

    // First we create the file object
    const uploadFileRoute = `${this.prefixUrl}/companies/${companyId}/files?filename=${file.name}&type=${file.type}&total_size=${file.size}`;
    const resource = ((await Api.post(uploadFileRoute, undefined)) as ResponseFileType)
      ?.resource as FileType;
    if (!resource) {
      throw new Error('A server error occured');
    }

    let pendingFile: PendingFileType = {
      tmpFile: file,
      file: null,
      resumable: null,
      status: 'pending',
      progress: 0,
    };

    pendingFile.file = resource;

    this.pendingFiles.push(pendingFile);
    //Update front (recoil ?)
    this.handler(this.pendingFiles);

    // Then we overwrite the file object with resumable
    pendingFile.resumable = this.getResumableInstance({
      target: Api.route(`${this.prefixUrl}/companies/${companyId}/files/${pendingFile.file.id}`),
      query: {
        thumbnail_sync: 1,
      },
      headers: {
        Authorization: JWTStorage.getAutorizationHeader(),
      },
    });

    pendingFile.resumable.addFile(file);

    pendingFile.resumable.on('fileAdded', (file: any, message: any) =>
      pendingFile.resumable.upload(),
    );

    pendingFile.resumable.on('fileProgress', (file: any, ratio: number) => {
      pendingFile.progress = file.progress();
      //TODO Trigger update frontend

      this.handler(this.pendingFiles);
    });

    pendingFile.resumable.on('fileSuccess', (file: any, message: string) => {
      pendingFile.file = JSON.parse(message).resource; //TODO check if this is right
      pendingFile.status = 'success';
      //TODO Trigger update frontend

      this.pendingFiles = this.pendingFiles.filter(p => p.file?.id !== pendingFile.file?.id);

      this.handler(this.pendingFiles);
    });

    pendingFile.resumable.on('fileError', (file: any, message: any) => {
      console.error('fileError =>', file, message);
      pendingFile.status = 'error';
      //TODO Trigger update frontend

      pendingFile.resumable.cancel();
      this.pendingFiles = this.pendingFiles.filter(p => p.file?.id !== pendingFile.file?.id);
    });
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
