import Avatar from 'app/atoms/avatar';
import { Base, Info } from 'app/atoms/text';
import { useDriveItem } from 'app/features/drive/hooks/use-drive-item';
import { DriveFileAccessLevel } from 'app/features/drive/types';
import AlertManager from 'app/features/global/services/alert-manager-service';
import { useUser } from 'app/features/users/hooks/use-user';
import currentUserService from 'app/features/users/services/current-user-service';
import { UserType } from 'app/features/users/types/user';
import { useState } from 'react';
import SelectUsers from '../../components/select-users';
import { AccessLevel } from './common';

export const InternalAccessManager = ({ id, disabled }: { id: string; disabled: boolean }) => {
  const { item, loading, update } = useDriveItem(id);

  console.log(item?.access_info.entities);

  const userEntities = item?.access_info.entities.filter(a => a.type === 'user') || [];
  const folderEntity = item?.access_info.entities.filter(a => a.type === 'folder')?.[0] || {
    type: 'folder',
    id: 'parent',
    level: 'manage',
  };
  const companyEntity = item?.access_info.entities.filter(a => a.type === 'company')?.[0];
  const channelEntities = item?.access_info.entities.filter(a => a.type === 'channel') || [];

  return (
    <>
      <Base className="block mt-4 mb-1">General access management</Base>

      <Info className="block mb-2">
        Specific user or channel rule is applied first. Then least restrictive level will be chosen
        between the parent folder and company accesses.
      </Info>

      <div className="rounded-md border overflow-hidden">
        {folderEntity && (
          <div className="p-4 border-b flex flex-row items-center justify-center">
            <div className="grow">
              <Base>Parent folder maximum level</Base>
              <br />
              <Info>Maximum level inherited from the parent folder.</Info>
            </div>
            <div className="shrink-0 ml-2">
              <AccessLevel
                disabled={loading || disabled}
                onChange={level => {
                  update({
                    access_info: {
                      entities: [
                        ...(item?.access_info.entities.filter(a => a.type !== 'folder') || []),
                        { ...folderEntity, level },
                      ],
                      public: item?.access_info.public,
                    },
                  });
                }}
                level={folderEntity.level}
              />
            </div>
          </div>
        )}

        {companyEntity && (
          <div className="p-4 border-b flex flex-row items-center justify-center">
            <div className="grow">
              <Base>Every member from the company</Base>
            </div>
            <div className="shrink-0 ml-2">
              <AccessLevel
                disabled={loading || disabled}
                onChange={level => {
                  update({
                    access_info: {
                      entities: [
                        ...(item?.access_info.entities.filter(a => a.type !== 'company') || []),
                        ...(level !== 'remove' ? [{ ...companyEntity, level }] : []),
                      ],
                      public: item?.access_info.public,
                    },
                  });
                }}
                level={companyEntity.level}
              />
            </div>
          </div>
        )}

        {channelEntities.length > 0 && (
          <div className="p-4 border-b flex flex-row items-center justify-center">
            <div className="grow">
              <Base>Channel access</Base>
              <br />
              <Info>
                Channels ({channelEntities.length}) from Twake chat tabs have access to this item.
              </Info>
            </div>
            <div className="shrink-0 ml-2">
              <AccessLevel
                disabled={loading || disabled}
                hiddenLevels={['none']}
                canRemove
                onChange={level => {
                  if (level === 'remove') {
                    AlertManager.confirm(
                      async () => {
                        //Remove channel access
                        update({
                          access_info: {
                            entities:
                              item?.access_info?.entities.filter(e => e.type !== 'channel') || [],
                            public: item?.access_info.public,
                          },
                        });
                      },
                      () => {},
                      {
                        text: 'You will need to go to Twake chat to give back access to this item.',
                      },
                    );
                  } else {
                    update({
                      access_info: {
                        entities:
                          item?.access_info?.entities.map(e => {
                            if (e.type === 'channel') {
                              return { ...e, level };
                            }
                            return e;
                          }) || [],
                        public: item?.access_info.public,
                      },
                    });
                  }
                }}
                level={channelEntities[0].level}
              />
            </div>
          </div>
        )}

        <div className="-mb-px" />
      </div>
      <div className="rounded-md border mt-2">
        <UserAccessSelector id={id} disabled={disabled} />

        {userEntities
          ?.sort((a, b) => a?.id?.localeCompare(b?.id))
          ?.map(user => (
            <UserAccessLevel key={user.id} id={id} userId={user?.id} disabled={disabled} />
          ))}
        <div className="-mb-px" />
      </div>
    </>
  );
};

const UserAccessSelector = ({ id, disabled }: { id: string; disabled: boolean }) => {
  const { item, loading, update } = useDriveItem(id);
  const [level, setLevel] = useState<DriveFileAccessLevel>('manage');

  return (
    <div className="p-4 flex flex-row items-center justify-center">
      <div className="grow">
        <SelectUsers
          className="rounded-r-none"
          onChange={(users: UserType[]) => {
            const id = users[0]?.id;
            update({
              access_info: {
                entities: [
                  //Add or replace existing user
                  ...(item?.access_info.entities.filter(a => a.type !== 'user' || a.id !== id) ||
                    []),
                  ...((id ? [{ type: 'user', id, level }] : []) as any),
                ],
                public: item?.access_info.public,
              },
            });
          }}
          initialUsers={[]}
        />
      </div>
      <div className="shrink-0">
        <AccessLevel
          className="rounded-l-none"
          disabled={loading || disabled}
          level={level}
          onChange={level => setLevel(level)}
        />
      </div>
    </div>
  );
};

const UserAccessLevel = ({
  id,
  userId,
  disabled,
}: {
  id: string;
  userId: string;
  disabled: boolean;
}) => {
  const { item, loading, update } = useDriveItem(id);
  const user = useUser(userId);
  const level =
    item?.access_info.entities.filter(a => a.type === 'user' && a.id === userId)?.[0]?.level ||
    'none';

  return (
    <div className="p-4 border-t flex flex-row items-center justify-center">
      <div className="shrink-0">
        <Avatar
          avatar={user?.thumbnail || ''}
          title={!user ? '-' : currentUserService.getFullName(user)}
          size="sm"
        />
      </div>
      <div className="grow ml-2">
        <Base>{!!user && currentUserService.getFullName(user)}</Base>
      </div>
      <div className="shrink-0 ml-2">
        <AccessLevel
          disabled={loading || disabled}
          level={level}
          canRemove
          onChange={level => {
            update({
              access_info: {
                entities:
                  level === 'remove'
                    ? item?.access_info?.entities.filter(
                        e => e.type !== 'user' || e.id !== userId,
                      ) || []
                    : item?.access_info?.entities.map(e => {
                        if (e.type === 'user' && e.id === userId) {
                          return { ...e, level };
                        }
                        return e;
                      }) || [],
                public: item?.access_info.public,
              },
            });
          }}
        />
      </div>
    </div>
  );
};
