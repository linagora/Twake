import { FileType } from 'app/models/File';
import Api from 'app/services/Api';

type ResponseFileType = { resource: FileType };
type UploadContextType = { companyId: string };

class FileUploadAPIClient {
  private readonly prefixUrl: string = '/internal/services/files/v1';

  upload(file: File, context: UploadContextType): Promise<ResponseFileType> {
    const uploadFileRoute = `${this.getRoute({ companyId: context.companyId })}?filename=${
      file.name
    }&type=${file.type}&total_size=${file.size}`;

    return Api.post<undefined, ResponseFileType>(uploadFileRoute, undefined);
  }

  getRoute({
    companyId,
    fileId = undefined,
    fullApiRouteUrl = false,
  }: {
    companyId: string;
    fileId?: string;
    fullApiRouteUrl?: boolean;
  }) {
    const route = `${this.prefixUrl}/companies/${companyId}/files${
      fileId !== undefined ? `/${fileId}` : ''
    }`;

    return fullApiRouteUrl ? Api.route(route) : route;
  }
}

export default new FileUploadAPIClient();
