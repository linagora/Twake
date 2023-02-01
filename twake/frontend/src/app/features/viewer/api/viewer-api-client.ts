import { ChannelType } from 'app/features/channels/types/channel';
import { Thumbnail } from 'app/features/drive/types';
import { MessageFileType, MessageWithReplies } from 'app/features/messages/types/message';
import { UserType } from 'app/features/users/types/user';
import Api from '../../global/framework/api-service';
import { TwakeService } from '../../global/framework/registry-decorator-service';

const MESSAGES_PREFIX = '/internal/services/messages/v1/companies';
const FILES_PREFIX = '/internal/services/files/v1/companies';

export type MessageFileDetails = MessageFileType & {
  user: UserType;
  message: MessageWithReplies;
  channel: ChannelType;
  navigation: {
    previous: null | {
      message_id: string;
      id: string;
    };
    next: null | {
      message_id: string;
      id: string;
    };
  };
};

export type DrivePublicFile = {
  company_id: string;
  id: string;
  user_id: string;
  application_id: null | string;
  updated_at: number;
  created_at: number;
  metadata: null | {
    name?: string;
    mime?: string;
    thumbnails_status?: 'done' | 'error' | 'waiting';
    external_id?: string;
    size?: number;
  };
  thumbnails: Thumbnail[];
  upload_data: null | {
    size: number;
    chunks: number;
  };
};

export type DriveFileDetails = DrivePublicFile & {
  navigation: {
    previous: null | {
      message_id: string;
      id: string;
    };
    next: null | {
      message_id: string;
      id: string;
    };
  };
  message?: null | any;
  user?: null | any;
};

@TwakeService('ViewerAPIClientService')
class ViewerAPIClient {
  async getMessageFile(companyId: string, messageId: string, msgFileId: string) {
    const route = `${MESSAGES_PREFIX}/${companyId}/messages/${messageId}/files/${msgFileId}`;
    return await Api.get<{ resource: MessageFileDetails }>(route);
  }

  async getPublicFile(companyId: string, fileId: string): Promise<{ resource: DriveFileDetails }> {
    return await Api.get<{ resource: DrivePublicFile }>(
      `${FILES_PREFIX}/${companyId}/files/${fileId}`,
    ).then(({ resource }) => ({
      resource: {
        ...resource,
        navigation: {
          next: null,
          previous: null,
        },
      },
    }));
  }
}

export default new ViewerAPIClient();
