import { WorkspaceType } from 'app/models/Workspace';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import CurrentUser from 'app/services/user/CurrentUser';
import UserAPIClient from 'app/services/user/UserAPIClient';
import WorkspaceAPIClient from 'app/services/workspaces/WorkspaceAPIClient';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import {
  ChannelWritingActivityState,
  ChannelWritingActivityType,
} from '../atoms/ChannelWritingActivity';
import { ThreadWritingActivitySelector } from '../selectors/ThreadWritingActivity';
import UserService from 'services/user/UserService';
import useRouterCompany from './useRouterCompany';
import { useCallback, useRef } from 'react';

const MAX_DELAY_BETWEEN_KEYDOWN = 500;
const MIN_DELAY_BETWEEN_EMIT = 8000;
const MAX_DELAY_AFTER_LAST_WRITE_EVENT = 10000;

export type WritingEvent = {
  type: 'writing';
  event: {
    channel_id: string;
    thread_id: string;
    user_id: string;
    name: string;
    is_writing: boolean;
  };
};

export type ChannelWritingActivityTypeEmit = {
  iAmWriting: (writing: boolean) => void;
};

export function useChannelWritingActivityState(
  channelId: string,
  threadId?: string | null,
): ChannelWritingActivityType[] {
  const threadIdSelector = useRecoilValue(
    ThreadWritingActivitySelector({ channelId: channelId, threadId: threadId || '' }),
  );
  return threadIdSelector;
}

let receivedWritingTimeout = new Map<string, number>();

export default function useChannelWritingActivity() {
  const companyId = useRouterCompany();

  const setChannelWritingActivityState = useRecoilCallback(
    ({ set, snapshot }) =>
      async (event: WritingEvent['event']) => {
        let currentList: ChannelWritingActivityType[] = await snapshot.getPromise(
          ChannelWritingActivityState(event.channel_id),
        );
        const newEvent: ChannelWritingActivityType = {
          threadId: event.thread_id,
          userId: event.user_id,
          name: event.name,
        };
        currentList = currentList.filter(elem => elem.userId !== newEvent.userId);
        if (event.is_writing) {
          currentList = [...currentList, newEvent];
        }
        set(ChannelWritingActivityState(event.channel_id), currentList);

        //Fallback stop is_writing in case of lost connection
        if (receivedWritingTimeout.has(event.user_id))
          clearTimeout(receivedWritingTimeout.get(event.user_id));
        if (event.is_writing) {
          receivedWritingTimeout.set(
            event.user_id,
            setTimeout(() => {
              setChannelWritingActivityState({ ...event, is_writing: false });
            }, MAX_DELAY_AFTER_LAST_WRITE_EVENT) as any,
          );
        }
      },
  );

  useRealtimeRoom<WritingEvent>(
    WorkspaceAPIClient.websockets(companyId)[0],
    'useChannelWritingActivity',
    (action, resource) => {
      if (action === 'event' && resource.type === 'writing') {
        setChannelWritingActivityState(resource.event);
      }
    },
  );
}

export function useChannelWritingActivityEmit(
  channelId: string,
  threadId: string | null,
): ChannelWritingActivityTypeEmit {
  const companyId = useRouterCompany();

  const { send } = useRealtimeRoom<WritingEvent>(
    WorkspaceAPIClient.websockets(companyId)[0],
    'useChannelWritingActivityEmit',
    (action, resource) => {},
  );
  (window as any).send = send;

  const iAmWriting = useCallback(
    async (writing: boolean) => {
      const currentUser = await UserAPIClient.getCurrent();
      send({
        type: 'writing',
        event: {
          channel_id: channelId,
          thread_id: threadId,
          user_id: currentUser.id,
          name: UserService.getFullName(currentUser),
          is_writing: writing,
        },
      } as WritingEvent);
    },
    [send],
  );
  return { iAmWriting: iAmWriting };
}

/** Keyboard typeing detection helper */
let writeTimeout = setTimeout(() => {}, 0);
export const useWritingDetector = () => {
  let lastEmit = useRef(new Date().getTime());

  const onKeydown = useCallback((emit: Function) => {
    const now = new Date().getTime();
    if (now - lastEmit.current > MIN_DELAY_BETWEEN_EMIT) {
      lastEmit.current = now;
      emit(true);
    }

    if (writeTimeout) {
      clearTimeout(writeTimeout);
    }
    writeTimeout = setTimeout(() => {
      emit(false);
      lastEmit.current = 0;
    }, MAX_DELAY_BETWEEN_KEYDOWN) as any;
  }, []);

  return { onKeydown };
};
