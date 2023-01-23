import Avatar from 'app/atoms/avatar';
import { Base, Info } from 'app/atoms/text';
import { useDriveItem } from 'app/features/drive/hooks/use-drive-item';
import AlertManager from 'app/features/global/services/alert-manager-service';
import { useUser } from 'app/features/users/hooks/use-user';
import currentUserService from 'app/features/users/services/current-user-service';
import { UserType } from 'app/features/users/types/user';
import SelectUsers from '../../components/select-users';
import { AccessLevel } from './common';

export const InternalAccessManager = ({ id }: { id: string }) => {
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
      <Base className="block mt-4 mb-1">
        <b>Manage access</b>
      </Base>

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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
      <div className="rounded-md border overflow-hidden mt-2">
        <div className="p-4 border-b flex flex-row items-center justify-center">
          <SelectUsers
            onChange={function (users: UserType[]): void {
              //TODO
            }}
            initialUsers={[]}
          />
        </div>

        {userEntities?.map(user => (
          <UserAccessLevel key={user.id} id={id} userId={user?.id} />
        ))}
        <div className="-mb-px" />
      </div>
    </>
  );
};

const UserAccessLevel = ({ id, userId }: { id: string; userId: string }) => {
  const { item, loading, update } = useDriveItem(id);
  const user = useUser(userId);
  const level =
    item?.access_info.entities.filter(a => a.type === 'user' && a.id === userId)?.[0]?.level ||
    'none';

  return (
    <div className="p-4 border-b flex flex-row items-center justify-center">
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
          disabled={loading}
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
