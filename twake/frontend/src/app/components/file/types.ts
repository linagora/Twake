import { PendingFileRecoilType } from 'app/features/files/types/file';

export type DataFileType = {
  id: string;
  name: string;
  thumbnail?: string;
  thumbnail_ratio: number;
  company_id?: string;
  size: number;
  type: string;
};
