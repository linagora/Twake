import { PendingFileRecoilType } from 'app/models/File';

export type DataFileType = {
  type: 'input' | 'message' | 'drive';
  file: {
    id: string;
    name: string;
    thumbnail: {
      url?: string;
    };
    company_id?: string;
    size: number;
    type: string;
    status?: PendingFileRecoilType['status'];
    progress?: number;
    backendFileId?: string;
  };
};
