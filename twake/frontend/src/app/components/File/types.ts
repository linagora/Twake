import { PendingFileRecoilType } from 'app/models/File';

export type DataFileType = {
  id: string;
  name: string;
  thumbnail?: string;
  company_id?: string;
  size: number;
  type: string;
};
