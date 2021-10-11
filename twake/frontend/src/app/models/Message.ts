export type ReactionType = { name: string; count: number; users: string[] };

export type ThumbnailType = {
  width: number; //Thumbnail width (for images only)
  height: number; //Thumbnail height (for images only)
  id: string; //Url to thumbnail (or set it to undefined if no relevant)
  index: number;
  size: number;
  type: string;
  url: string;
};

export type MessageFileMetadataType =
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

export type MessageFileMetadataSource = 'internal' | 'drive' | string;

export type MessageFileType = {
  //
  //Primary key
  id?: string;
  company_id?: string; // optional
  message_id?: string; // optional

  metadata?: {
    //File information when attached (it can change if edited)
    source?: MessageFileMetadataSource;
    external_id: string;
    name: string; //Original name
    size: number; //Original weight
    extension?: string; //File extension
    type: MessageFileMetadataType | string;
    thumbnails: ThumbnailType[];
  };
};

export type Message = {
  id?: string;
  application_id?: string | null;
  channel_id?: string;
  content?: any;
  creation_date?: number;
  edited?: boolean;
  front_id?: string;
  hidden_data?: any;
  increment_at_time?: number | null;
  message_type?: 0 | 1 | 2;
  modification_date?: number;
  parent_message_id?: string | null;
  pinned?: boolean;
  reactions?: ReactionType[];
  responses_count?: number | null;
  sender?: string | null;
  user_specific_content?: any;
  _user_ephemeral?: any;
  _last_modified?: string;
  _user_reaction?: any;
  subtype?:
    | null
    | 'application' //Message from a connector
    | 'deleted' //Message deleted by user
    | 'system';
  files?: MessageFileType[];
};
