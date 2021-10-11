import Resumable from 'services/uploadManager/resumable';

export type MetaDataType = {
  name: string;
  mime: string;
  thumbnails_status?: string;
};

export type ThumbnailObjectType = {
  index: number;
  id: string;
  size: number;
  type: string;
  width: number;
  height: number;
};

export type FileUploadDataObjectType = {
  size: number;
  chunks: number;
};

export type FileType = {
  company_id: string;
  id: string;
  application_id: string;
  created_at: number;
  encryption_key: string;
  metadata: MetaDataType;
  thumbnails: ThumbnailObjectType[];
  updated_at: number;
  upload_data: FileUploadDataObjectType;
  user_id: string;
};

export type PendingFileRecoilType = {
  id: string;
  status: 'pending' | 'error' | 'success' | 'pause';
  progress: number; //Between 0 and 1
  file: FileType | null;
};

export type PendingFileType = {
  resumable: typeof Resumable | null; //Contain the resumable instance in charge of this file
  uploadTaskId: string;
  id: string;
  status: 'pending' | 'error' | 'success' | 'pause';
  progress: number; //Between 0 and 1
  originalFile: File; //Will be used to get filename, temporary thumbnail
  backendFile: FileType | null; //Will contain the final object returned by API
};
