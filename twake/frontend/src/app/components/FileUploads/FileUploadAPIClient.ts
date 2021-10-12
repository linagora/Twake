import Api from 'app/services/Api';
import { FileType } from 'app/models/File';

type ResponseFileType = { resource: FileType };

type BaseContentType = { companyId: string };
type GetContextType = BaseContentType & { fileId: string };
type DeleteContextType = BaseContentType & { fileId: string };
type DownloadContextType = BaseContentType & { fileId: string };

class FileUploadAPIClient {
  private readonly prefixUrl: string = '/internal/services/files/v1';

  public upload(file: File, context: BaseContentType): Promise<ResponseFileType> {
    const uploadFileRoute = `${this.getRoute({ companyId: context.companyId })}?filename=${
      file.name
    }&type=${file.type}&total_size=${file.size}`;

    return Api.post<undefined, ResponseFileType>(uploadFileRoute, undefined);
  }

  public get({ companyId, fileId }: GetContextType): Promise<ResponseFileType> {
    const getFileRoute = this.getRoute({ fileId, companyId });

    return Api.get<ResponseFileType>(getFileRoute);
  }

  public getRoute({
    companyId,
    fileId = undefined,
    fullApiRouteUrl = false,
    download,
  }: {
    companyId: string;
    fileId?: string;
    fullApiRouteUrl?: boolean;
    download?: boolean;
  }): string {
    const route = `${this.prefixUrl}/companies/${companyId}/files${
      fileId !== undefined ? `/${fileId}${download ? '/download' : ''}` : ''
    }`;

    return fullApiRouteUrl ? Api.route(route) : route;
  }

  public getFileThumbnailUrl({
    companyId,
    fileId,
    thumbnailId,
  }: {
    companyId: string;
    fileId: string;
    thumbnailId: string;
  }): string {
    return `${this.getRoute({
      companyId,
      fileId,
      fullApiRouteUrl: true,
    })}/thumbnails/${thumbnailId}`;
  }

  public delete({ companyId, fileId }: DeleteContextType): Promise<unknown> {
    const deleteFileRoute = this.getRoute({ companyId, fileId });

    return Api.delete<undefined, undefined>(deleteFileRoute, undefined);
  }

  public download({ companyId, fileId }: DownloadContextType): Promise<Blob> {
    const downloadFileRoute = this.getRoute({ companyId, fileId, download: true });
    return Api.get<Blob>(downloadFileRoute, undefined, true, {
      fileDownload: true,
    });
  }
}

export default new FileUploadAPIClient();
