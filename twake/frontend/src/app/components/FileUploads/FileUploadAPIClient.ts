import { FileType } from 'app/models/File';
import Api from 'app/services/Api';

type ResponseFileType = { resource: FileType };

class FileUploadAPIClient {
  private readonly prefixUrl: string = '/internal/services/files/v1';

  async uploadOneFile(file: File, context: { companyId: string }): Promise<ResponseFileType> {
    const uploadFileRoute = `${this.prefixUrl}/companies/${context.companyId}/files?filename=${file.name}&type=${file.type}&total_size=${file.size}`;

    return await Api.post<undefined, ResponseFileType>(uploadFileRoute, undefined);
  }

  getRoute({ fileId, companyId }: { fileId?: string; companyId: string }) {
    return `${this.prefixUrl}/companies/${companyId}/files/${fileId}`;
  }
}

export default new FileUploadAPIClient();
