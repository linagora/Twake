export type DriveItemDetails = {
  item: DriveItem;
  versions: DriveItemVersion[];
  children: DriveItem[];
  path: DriveItem[];
  access: 'read' | 'write' | 'manage';
  websockets: {
    room: string;
    token?: string;
  }[];
};

export type DriveItem = {
  id: string;
  company_id: string;
  workspace_id: string;

  parent_id: string;
  in_trash: boolean;
  is_directory: boolean;
  name: string;
  extension: string;
  description: string;
  tags: [];

  added: string;
  last_modified: string;
  last_version_cache: DriveItemVersion;

  access_info: DriveItemAccessInfo;

  size: number;
};

export type DriveFileAccessLevel = 'none' | 'read' | 'write' | 'manage';

export type DriveItemAccessInfo = {
  public?: {
    token: string;
    level: DriveFileAccessLevel;
  };
  entities: AuthEntity[];
};

type AuthEntity = {
  type: 'user' | 'channel' | 'company' | 'folder';
  id: string | 'parent';
  level: DriveFileAccessLevel;
};

export type DriveItemVersion = {
  //Id of the version of the file
  id: string;

  //The file itself, using the existing new node "file" entity
  provider: string | 'drive' | 'internal'; //Equivalent to "source" in twake/backend/node/src/services/messages/entities/message-files.ts
  drive_item_id: string;
  file_metadata: FileMetadata; //New field

  date_added: number;
  creator_id: string;
  application_id: string;
};

export type FileMetadata = {
  source: 'internal' | 'drive' | string; //Uuid of the corresponding connector
  external_id: string;

  name?: string; //Original file name
  mime?: string; //Original file mime
  size?: number; //Original file weight
  thumbnails?: Thumbnail[]; //Url to thumbnail (or set it to undefined if no relevant)
};

export type Thumbnail = {
  index?: number;
  id?: string;

  type?: string;
  size?: number;
  width?: number;
  height?: number;

  url: string;
  full_url?: string;
};
