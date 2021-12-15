import { WorkspaceType } from 'app/models/Workspace';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import CurrentUser from 'app/services/user/CurrentUser';
import UserAPIClient from 'app/services/user/UserAPIClient';
import WorkspaceAPIClient from 'app/services/workspaces/WorkspaceAPIClient';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import { setTimeout } from 'timers';
import {
  ChannelWritingActivityState,
  ChannelWritingActivityType,
} from '../atoms/ChannelWritingActivity';
import { ThreadWritingActivitySelector } from '../selectors/ThreadWritingActivity';
import UserService from 'services/user/UserService';
import useRouterCompany from './useRouterCompany';

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

export type ChannelActivityWritingType = {
  users: { userId: string; name: string }[];
  iAmWriting: () => void;
};

export default function useChannelActivityWriting(
  channelId: string,
  threadId: string | null,
): ChannelActivityWritingType {
  const companyId = useRouterCompany();
  const [channelsActivity, setChannelsActivity] = useRecoilState(
    ChannelWritingActivityState(channelId),
  );
  /*const [threadActivity, setThreadActivity] = useRecoilValue(
    ThreadWritingActivitySelector(threadId),
  );*/

  const setChannelWritingActivityState = useRecoilCallback(
    ({ set, snapshot }) =>
      async (event: WritingEvent['event']) => {
        const currentList = await snapshot.getPromise(
          ChannelWritingActivityState(event.channel_id),
        );
        const newEvent: ChannelWritingActivityType = {
          threadId: event.thread_id,
          userId: event.user_id,
          name: event.name,
        };
        //supprimer de la liste
        currentList.filter(elem => elem === newEvent);

        if (event.is_writing === true) {
          const newList = [...currentList, newEvent];
          set(ChannelWritingActivityState(event.channel_id), newList);
        }
        //TODO: add timer on receiver side
        set(ChannelWritingActivityState(event.channel_id), currentList);
      },
  );

  const { send } = useRealtimeRoom<WritingEvent>(
    WorkspaceAPIClient.websockets(companyId)[0],
    'useChannelWritingActivity',
    (action, resource) => {
      if (action === 'event' && resource.type === 'writing') {
        console.log('salut les potes received', resource);
        setChannelWritingActivityState(resource.event);
      }
    },
  );
  (window as any).send = send;

  const iAmWriting = async (writing: boolean = true) => {
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
    if (writing) setTimeout(clearWriting, 3000); //TODO: be carfull of something: surprise( gerer l'annulation de timeout) => clear timeout
  };

  const clearWriting = () => {
    iAmWriting(false);
  };

  return { users: channelsActivity, iAmWriting: iAmWriting };
}
