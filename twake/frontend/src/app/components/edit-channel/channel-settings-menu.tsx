import {
  BellIcon,
  ChevronRightIcon,
  HandIcon,
  LogoutIcon,
  PhotographIcon,
  StarIcon,
} from '@heroicons/react/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/solid';
import Avatar from 'app/atoms/avatar';
import { UsersIcon } from 'app/atoms/icons-agnostic';
import A from 'app/atoms/link';
import { Base, Info } from 'app/atoms/text';
import {
  useChannelMember,
  useChannelMemberCurrentUser,
} from 'app/features/channel-members-search/hooks/member-hook';
import { ChannelType } from 'app/features/channels/types/channel';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import workspaceUserRightsService from 'app/features/workspaces/services/workspace-user-rights-service';
import Block from 'app/molecules/grouped-rows/base';

export const ChannelSettingsMenu = (props: {
  channel?: ChannelType;
  onEditChannel?: Function;
  onAccess?: Function;
  onMedias?: Function;
  onNotifications?: Function;
  onMembers?: Function;
  onFavorite?: Function;
  onLeave?: Function;
}) => {
  const icon = props.channel?.icon || '';
  const name = props.channel?.name || '';

  const { user } = useCurrentUser();
  const { member } = useChannelMemberCurrentUser(props.channel?.id || '');
  const canEdit =
    props.channel?.owner === user || workspaceUserRightsService.hasWorkspacePrivilege();
  const isGuest = workspaceUserRightsService.isInvite();

  return (
    <div className="w-screen max-w-xs">
      <Block
        onClick={() => {
          canEdit && props.onEditChannel && props.onEditChannel();
        }}
        className={
          '-mx-2 my-2 p-2 rounded-md ' +
          (canEdit ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-zinc-800' : '')
        }
        title={<span className="capitalize">{name || ''}</span>}
        subtitle={
          canEdit ? (
            <Info>
              <A>Edit channel information</A>
            </Info>
          ) : (
            <></>
          )
        }
        avatar={<Avatar size="lg" avatar={icon.length > 20 ? icon : ''} title={name || ''} />}
        suffix={canEdit ? <ChevronRightIcon className="w-5 h-5 text-zinc-500" /> : <></>}
      />
      <hr className="my-2 -mx-4" />
      <Block
        onClick={() => {
          canEdit && props.onAccess && props.onAccess();
        }}
        className={
          '-mx-2 my-1 p-2 rounded-md ' +
          (canEdit ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-zinc-800' : '')
        }
        title={<Base className="font-semibold">Channel access</Base>}
        subtitle={<></>}
        avatar={<HandIcon className="text-blue-500 w-6 h-6" />}
        suffix={
          <div className="flex flex-row items-center justify-center">
            <Info className="block mr-2">
              {props.channel?.visibility === 'public' ? 'Public' : 'Private'}
            </Info>
            {canEdit ? <ChevronRightIcon className="w-5 h-5 text-zinc-500" /> : <> </>}
          </div>
        }
      />
      {!isGuest && (
        <Block
          onClick={() => {
            canEdit && props.onMembers && props.onMembers();
          }}
          className={
            '-mx-2 my-1 p-2 rounded-md ' +
            (canEdit ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-zinc-800' : '')
          }
          title={<Base className="font-semibold">Members</Base>}
          subtitle={<></>}
          avatar={<UsersIcon className="text-blue-500 w-6 h-6" />}
          suffix={<ChevronRightIcon className="w-5 h-5 text-zinc-500" />}
        />
      )}
      <Block
        onClick={() => {
          props.onMedias && props.onMedias();
        }}
        className="-mx-2 my-1 p-2 rounded-md cursor-pointer hover:bg-blue-50 dark:hover:bg-zinc-800"
        title={<Base className="font-semibold">Media and documents</Base>}
        subtitle={<></>}
        avatar={<PhotographIcon className="text-blue-500 w-6 h-6" />}
        suffix={<ChevronRightIcon className="w-5 h-5 text-zinc-500" />}
      />
      <hr className="my-2 -mx-4" />
      <Block
        onClick={() => {}}
        className="-mx-2 my-1 p-2 rounded-md cursor-pointer hover:bg-blue-50 dark:hover:bg-zinc-800"
        title={
          member?.favorite ? (
            <Base className="font-semibold">Remove from favorites</Base>
          ) : (
            <Base className="font-semibold">Add to favorites</Base>
          )
        }
        subtitle={<></>}
        avatar={
          member?.favorite ? (
            <StarIconSolid className="text-yellow-500 w-6 h-6" />
          ) : (
            <StarIcon className="text-blue-500 w-6 h-6" />
          )
        }
      />
      <Block
        onClick={() => {
          props.onNotifications && props.onNotifications();
        }}
        className="-mx-2 my-1 p-2 rounded-md cursor-pointer hover:bg-blue-50 dark:hover:bg-zinc-800"
        title={<Base className="font-semibold">Notifications settings</Base>}
        subtitle={<></>}
        avatar={<BellIcon className="text-blue-500 w-6 h-6" />}
        suffix={<ChevronRightIcon className="w-5 h-5 text-zinc-500" />}
      />
      {!canEdit && (
        <Block
          onClick={() => {
            props.onLeave && props.onLeave();
          }}
          className="-mx-2 my-1 p-2 rounded-md cursor-pointer hover:bg-red-50 dark:hover:bg-red-800"
          title={
            <Base noColor className="font-semibold text-red-500">
              Leave channel
            </Base>
          }
          subtitle={<></>}
          avatar={<LogoutIcon className="text-red-500 w-6 h-6" />}
        />
      )}
      <div className="-mb-2" />
    </div>
  );
};
