import { useRecoilState } from 'recoil';
import useRouterChannel from 'app/features/router/hooks/use-router-channel';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { LoadingState } from 'app/features/global/state/atoms/Loading';
import messageApiClient from 'app/features/messages/api/message-api-client';
import { useGlobalEffect } from 'app/features/global/hooks/use-global-effect';
import {
  channelAttachmentFileState,
  channelAttachmentListState,
  channelAttachmentMediaState,
} from '../state/channel-attachment-list';
import _ from 'lodash';

export const useChannelAttachmentList = (type: 'file' | 'media') => {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const channelId = useRouterChannel();
  const [loading, setLoading] = useRecoilState(
    LoadingState(`useChannelAttachmentList-${type}-${companyId}-${workspaceId}-${channelId}`),
  );
  const [isOpen] = useRecoilState(channelAttachmentListState);
  const [result, setResult] = useRecoilState(
    type === 'media'
      ? channelAttachmentMediaState(companyId)
      : channelAttachmentFileState(companyId),
  );

  const options = _.omitBy(
    {
      limit: 25,
      is_file: type === 'file' || undefined,
      is_media: type === 'media' || undefined,
      workspace_id: workspaceId,
      channel_id: channelId,
    },
    _.isUndefined,
  );

  const loadItems = async () => {
    setLoading(true);

    const response = await messageApiClient.searchFile(null, options);
    const results = (response.resources || []).sort(
      (a, b) => (b?.message?.created_at || 0) - (a?.message?.created_at || 0),
    );
    
    console.debug('useChannelAttachmentList- r', results);

    const update = {
      results,
      nextPage: response.next_page_token || null,
    };

    setResult(update);
    setLoading(false);
  };

  useGlobalEffect(
    `useChannelAttachmentList${type}`,
    () => {
      console.debug('useChannelAttachmentList', type, companyId, workspaceId, channelId, isOpen);
      if (isOpen) {
        (async () => {
          setLoading(true);
          await loadItems();
        })();
      }
    },
    [channelId, workspaceId, isOpen],
  );

  return {
    loading,
    result: result.results,
    loadItems,
  };
};

export const useChannelMediaList = () => {
  return useChannelAttachmentList('media');
};

export const useChannelFileList = () => {
  return useChannelAttachmentList('file');
};
