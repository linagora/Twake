import Api from 'app/features/global/framework/api-service';
import { FileType, MetaDataType } from 'app/features/files/types/file';
import { MessageFileType } from 'app/features/messages/types/message';
import extensionToMime from '../utils/extension-to-mime';
import { fileTypeMimes } from '../utils/type-mimes';

type ResponseFileType = { resource: FileType };
type ResponseDeleteFileType = { status: 'success' | 'error' };

type BaseContentType = { companyId: string };
type GetContextType = BaseContentType & { fileId: string };
type DeleteContextType = BaseContentType & { fileId: string };
type DownloadContextType = BaseContentType & { fileId: string };

type FileTypes =
  | 'link'
  | 'code'
  | 'document'
  | 'image'
  | 'pdf'
  | 'slides'
  | 'sound'
  | 'spreadsheet'
  | 'video'
  | 'archive'
  | 'other';

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

  public getFileThumbnailUrl(file: Pick<FileType, 'id' | 'company_id' | 'thumbnails'>): string {
    if (!file.thumbnails?.[0]?.index) return '';
    return `${this.getRoute({
      companyId: file.company_id,
      fileId: file.id,
      fullApiRouteUrl: true,
    })}/thumbnails/${file.thumbnails?.[0]?.index}`;
  }

  public getFileThumbnailUrlFromMessageFile(file: MessageFileType): string {
    if (file.metadata?.source !== 'internal') return file.metadata?.thumbnails?.[0]?.url || '';
    if (!file.metadata?.thumbnails?.[0]) {
      return '';
    }
    return `${this.getRoute({
      companyId:
        (typeof file.metadata?.external_id === 'string'
          ? file.company_id
          : file.metadata?.external_id?.company_id) || '',
      fileId:
        (typeof file.metadata?.external_id === 'string'
          ? file.metadata?.external_id
          : file.metadata?.external_id?.id) || '',
      fullApiRouteUrl: true,
    })}/thumbnails/${file.metadata?.thumbnails?.[0]?.index}`;
  }

  public delete({ companyId, fileId }: DeleteContextType): Promise<ResponseDeleteFileType> {
    const deleteFileRoute = this.getRoute({ companyId, fileId });
    return Api.delete<ResponseDeleteFileType>(deleteFileRoute, undefined);
  }

  public download({ companyId, fileId }: DownloadContextType): Promise<Blob> {
    const downloadFileRoute = this.getRoute({ companyId, fileId, download: true });
    return Api.get<Blob>(downloadFileRoute, undefined, true, {
      withBlob: true,
    });
  }

  public getDownloadRoute({ companyId, fileId }: DownloadContextType): string {
    return this.getRoute({ companyId, fileId, download: true, fullApiRouteUrl: true });
  }

  public mimeToType(mime: string): FileTypes {
    const { archives, images, pdf, slides, sound, spreadsheets, videos } = fileTypeMimes;

    if (images.includes(mime)) return 'image';
    if (videos.includes(mime)) return 'video';
    if (sound.includes(mime)) return 'sound';
    if (pdf.includes(mime)) return 'pdf';
    if (slides.includes(mime)) return 'slides';
    if (archives.includes(mime)) return 'archive';
    if (spreadsheets.includes(mime)) return 'spreadsheet';
    
    return 'other';
  }

  public extensionToMime(extension: string): string {
    return extensionToMime[extension] || '';
  }

  async recent(companyId: string, filter: 'file' | 'media', limit: number): Promise<FileType[]> {
    if (filter === 'file') {
      return [
        {
          metadata: {
            name: 'covenant.xlsx',
            mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          } as MetaDataType,
        } as FileType,
        {
          metadata: {
            name: 'report.doc',
            mime: 'application/msword',
          } as MetaDataType,
        } as FileType,
        {
          metadata: {
            name: 'meeting_notes.pdf',
            mime: 'application/pdf',
          } as MetaDataType,
        } as FileType,
        {
          metadata: {
            name: 'covenant.xlsx',
            mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          } as MetaDataType,
        } as FileType,
      ] as FileType[];
    } else {
      const files = [
        '15a579ac-23f9-470e-b856-07a7a1a834ca',
        '62746ee9-6101-4476-9e20-be55e9eea4ea',
      ];

      return files.map(file => {
        return {
          metadata: {
            source: 'internal',
            external_id: {
              id: file,
              company_id: '56393af2-e5fe-11e9-b894-0242ac120004',
            },
          } as any,
        } as FileType;
      });
    }
  }
}

export default new FileUploadAPIClient();
