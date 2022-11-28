import React from 'react';

import { ChannelType } from 'app/features/channels/types/channel';
import Languages from 'app/features/global/services/languages-service';
import ChannelCategory from '../Parts/Channel/ChannelCategory';
import ChannelIntermediate from '../Parts/Channel/ChannelIntermediate';
import Menu from 'components/menus/menu.jsx';
import Icon from 'app/components/icon/icon';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import RouterServices from 'app/features/router/services/router-service';
import { useSearchModal } from 'app/features/search/hooks/use-search';
import { SearchInputState, SearchTabsState } from 'app/features/search/state/search-input';
import { useSetRecoilState } from 'recoil';
import { useOpenChannelModal } from 'app/components/edit-channel';

type Props = {
  sectionTitle: string;
  channels: ChannelType[];
  favorite?: boolean;
  subgroup?: boolean;
};

export default (props: Props) => {
  const { workspaceId, companyId } = RouterServices.getStateFromRoute();
  const openChannelModal = useOpenChannelModal();

  const addChannel = () => {
    openChannelModal('');
  };

  const { setOpen: setSearchopen } = useSearchModal();
  const setSearchInput = useSetRecoilState(SearchInputState);
  const setSearchTab = useSetRecoilState(SearchTabsState);

  const joinChannel = () => {
    setSearchopen(true);
    setSearchInput({ query: '' });
    setSearchTab('channels');
  };

  return (
    <>
      <ChannelCategory
        text={props.sectionTitle}
        suffix={
          !props.favorite &&
          !props.subgroup &&
          AccessRightsService.hasLevel(workspaceId, 'member') &&
          AccessRightsService.getCompanyLevel(companyId) !== 'guest' && (
            <Menu
              className="add channel-menu"
              menu={[
                {
                  type: 'menu',
                  text: Languages.t('components.leftbar.channel.workspaceschannels.menu.option_1'),
                  // Don't remove this className, we need it for integration tests
                  className: 'add-channel',
                  onClick: () => addChannel(),
                },
                {
                  type: 'menu',
                  // Don't remove this className, we need it for integration tests
                  className: 'join-channel',
                  text: Languages.t('components.leftbar.channel.workspaceschannels.menu.option_2'),
                  onClick: () => joinChannel(),
                },
              ]}
            >
              <Icon type="plus" className="m-icon-small" />
            </Menu>
          )
        }
      />
      {props.channels.length === 0 && (
        <div className="channel_small_text">
          {Languages.t('scenes.app.channelsbar.channelsworkspace.no_channel')}
        </div>
      )}
      {props.channels.length > 0 &&
        props.channels.map((data, key) => {
          return <ChannelIntermediate key={key} channel={data || ''} />;
        })}
    </>
  );
};
