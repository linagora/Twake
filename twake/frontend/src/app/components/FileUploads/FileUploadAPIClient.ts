import { FileType } from 'app/models/File';
import Api from 'app/services/Api';

type ResponseFileType = { resource: FileType };

type BaseContentType = { companyId: string };
type GetContextType = BaseContentType & { fileId: string };
type DeleteContextType = BaseContentType & { fileId: string };

class FileUploadAPIClient {
  private readonly prefixUrl: string = '/internal/services/files/v1';

  public upload(file: File, context: BaseContentType): Promise<ResponseFileType> {
    const uploadFileRoute = `${this.getRoute({ companyId: context.companyId })}?filename=${
      file.name
    }&type=${file.type}&total_size=${file.size}`;

    return Api.post<undefined, ResponseFileType>(uploadFileRoute, undefined);
  }

  public async get({ companyId, fileId }: GetContextType): Promise<ResponseFileType> {
    const getFileRoute = this.getRoute({ fileId, companyId });

    return await Api.get<ResponseFileType>(getFileRoute);
  }

  public getRoute({
    companyId,
    fileId = undefined,
    fullApiRouteUrl = false,
  }: {
    companyId: string;
    fileId?: string;
    fullApiRouteUrl?: boolean;
  }): string {
    const route = `${this.prefixUrl}/companies/${companyId}/files${
      fileId !== undefined ? `/${fileId}` : ''
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

  public delete({ companyId, fileId }: DeleteContextType): void {
    const deleteFileRoute = this.getRoute({ companyId, fileId });

    Api.delete<undefined, undefined>(deleteFileRoute, undefined);
  }
}

export default new FileUploadAPIClient();
