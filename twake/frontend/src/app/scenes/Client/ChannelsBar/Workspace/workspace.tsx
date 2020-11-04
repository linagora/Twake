import React, { Component } from 'react';

import { useParams } from 'react-router-dom';
import { ChannelType } from 'app/models/Channel';
import { ChannelResource } from 'app/models/Channel';
import { Collection } from 'services/CollectionsReact/Collections';
import RouterServices from 'services/RouterServices';
import OldCollections from 'services/Depreciated/Collections/Collections';
import WorkspaceChannels from 'components/Leftbar/Channel/workspaceChannels';

type channelCategoryType = {
  favorite: { data: ChannelType }[];
  workspace: { data: ChannelType }[];
  inGroup: { data: ChannelType }[];
};

export function Workspace() {
  let channelCategory: channelCategoryType = {
    favorite: [],
    workspace: [],
    inGroup: [],
  };

  const params: any = useParams();
  const workspaceId: string = RouterServices.translateToUUID(params.workspaceId);
  const companyId: string = OldCollections.get('workspaces').find(workspaceId)?.group?.id;
  const url: string = `/companies/${companyId}/workspaces/${workspaceId}/channels/`;
  const channelsCollection = Collection.get(url, ChannelResource);

  const channels =
    channelsCollection.useWatcher(async () => await channelsCollection.find({})) || [];

  channels.map(channel => {
    switch (true) {
      case channel.data.user_member?.favorite:
        channelCategory.workspace.push(channel);
        channelCategory.favorite.push(channel);
        break;
      case channel.data.channel_group && channel.data.channel_group.length > 1:
        channelCategory.inGroup.push(channel);
        break;
      default:
        channelCategory.workspace.push(channel);
    }
  });

  let groupsName: string[] = [];
  let groups: { name: string; channels: { data: object }[] }[] = [];

  channelCategory.inGroup.map(channel => {
    if (channel.data.channel_group && channel.data.channel_group.length > 1) {
      if (groups.length === 0) {
        groupsName.push(channel.data.channel_group);
        groups.push({
          name: channel.data.channel_group,
          channels: [channel],
        });
      } else {
        if (groupsName.includes(channel.data.channel_group)) {
          const groupIndex = groups.findIndex(group => group.name === channel.data.channel_group);
          groups[groupIndex].channels.push(channel);
        } else {
          groupsName.push(channel.data.channel_group);
          groups.push({
            name: channel.data.channel_group,
            channels: [channel],
          });
        }
      }
    }
  });

  return (
    <div className="workspace_channels">
      {channelCategory.favorite.length !== 0 && (
        <WorkspaceChannels
          key={'favoriteChannels'}
          workspaceTitle="scenes.app.channelsbar.channelsworkspace.channel_title.favorite"
          channelsApp={channelCategory.favorite}
        />
      )}
      {!(channelCategory.workspace.length === 0 && channelCategory.inGroup.length !== 0) && (
        <WorkspaceChannels
          key={'channels'}
          workspaceTitle="scenes.app.channelsbar.channelsworkspace.channel_title"
          channelsApp={channelCategory.workspace}
        />
      )}
      {groups.map((group, index) => (
        <WorkspaceChannels key={index} workspaceTitle={group.name} channelsApp={group.channels} />
      ))}
    </div>
  );
}

/*
ChannelsWorkspace.js

import React, { Component } from 'react';

import Globals from 'services/Globals.js';
import Languages from 'services/languages/languages.js';
import Workspaces from 'services/workspaces/workspaces.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import User from 'services/user/user.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import ChannelCategory from 'components/Leftbar/Channel/ChannelCategory.js';
import ChannelDroppableZone from 'components/Leftbar/Channel/ChannelDroppableZone.js';
import ChannelUI from 'components/Leftbar/Channel/Channel.js';
import Channel from '../Channel.js';
import ChannelsService from 'services/channels/channels.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import MenusManager from 'services/Menus/MenusManager.js';
import MediumPopupComponent from 'app/services/Modal/ModalManager';
import ChannelWorkspaceEditor from 'app/scenes/Client/ChannelsBar/ChannelWorkspaceEditor';
import InputEnter from 'components/Inputs/InputEnter.js';

export default class ChannelsWorkspace extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
      workspaces: Workspaces,
      workspaces_repository: Collections.get('workspaces'),
      channels_repository: Collections.get('channels'),
      workspaces_apps: WorkspacesApps,
      channels: ChannelsService,
    };

    Languages.addListener(this);
    Workspaces.addListener(this);
    ChannelsService.addListener(this);
    Collections.get('workspaces').addListener(this);
    Collections.get('channels').addListener(this);
    Collections.get('users').addListener(this);
    Collections.get('users').listenOnly(this, [
      Collections.get('users').find(User.getCurrentUserId()).front_id,
    ]);
    WorkspacesApps.addListener(this);
    WorkspaceUserRights.addListener(this);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Workspaces.removeListener(this);
    ChannelsService.removeListener(this);
    Collections.get('workspaces').removeListener(this);
    Collections.get('channels').removeListener(this);
    Collections.get('users').removeListener(this);
    WorkspacesApps.removeListener(this);
    WorkspaceUserRights.removeListener(this);
  }
  moveChannelToGroup(channel, group_name) {
    //If was pinned, just unpin, dont try to moe group
    if ((this.pinned_channels || []).filter(item => item.id == channel.id).length > 0) {
      return;
    }

    if (group_name === false) {
      group_name = 'New group';
    }

    if (channel.channel_group_name == group_name) {
      return;
    }

    var chan = Collections.get('channels').find(channel.id);
    chan.channel_group_name = group_name;
    Collections.get('channels').save(chan, 'channels_' + Workspaces.currentWorkspaceId);
  }
  saveGroupName(list_of_channels, id) {
    if (id !== this.didChangeGroupName) {
      return;
    }
    this.didChangeGroupName = false;
    //Wait for update
    setTimeout(() => {
      list_of_channels.forEach(channel => {
        Collections.get('channels').save(channel, 'channels_' + Workspaces.currentWorkspaceId);
      });
    }, 200);
  }
  changeGroupName(newname, list_of_channels) {
    this.didChangeGroupName = newname;
    list_of_channels.forEach(channel => {
      channel.channel_group_name = newname;
      Collections.get('channels').completeObject(channel);
    });
    Collections.get('channels').notify();
    this.saveGroupName(list_of_channels, newname);
  }
  editGroupName(evt, idname) {
    MenusManager.openMenu(
      [
        {
          type: 'react-element',
          reactElement: level => {
            return (
              <div>
                <InputEnter
                  className="full_width"
                  autoFocus
                  defaultValue={idname}
                  placeholder={Languages.t(
                    'scenes.app.channelsbar.channelsworkspace.group_name',
                    [],
                    'Nom du groupe',
                  )}
                  onKeyPress={evt => {
                    if (evt.key === 'Enter') {
                      MenusManager.closeMenu();
                      this.changeGroupName(evt.target.value, this.channels_by_groups[idname]);
                    }
                  }}
                />
              </div>
            );
          },
        },
        {
          text: Languages.t(
            'scenes.app.channelsbar.channelsworkspace.remove_group',
            [],
            'Retirer le groupe',
          ),
          className: 'danger',
          icon: 'trash',
          onClick: () => this.changeGroupName('', this.channels_by_groups[idname], idname),
        },
      ],
      { x: evt.clientX, y: evt.clientY + 16 },
      'bottom',
    );
  }
  addChannel() {
    return MediumPopupComponent.open(
      <ChannelWorkspaceEditor title={'scenes.app.channelsbar.channelsworkspace.create_channel'} />,
      {
        position: 'center',
        size: { width: '600px' },
      },
    );
  }
  render() {
    var workspace = Collections.get('workspaces').known_objects_by_id[
      Workspaces.currentWorkspaceId
    ];
    var all_channels = Collections.get('channels').findBy({
      direct: false,
      application: false,
      original_workspace: Workspaces.currentWorkspaceId,
    });
    all_channels = all_channels
      .filter(channel => channel)
      .filter(
        channel =>
          channel.members &&
          Object.values(channel.members || []).length &&
          Object.values(channel.members || [])
            .concat(Object.values(channel.ext_members || []))
            .indexOf(User.getCurrentUserId()) >= 0,
      );

    var pinned_channels_preferences =
      (
        ((Collections.get('users').find(User.getCurrentUserId()) || {}).workspaces_preferences ||
          {})[Workspaces.currentWorkspaceId] || {}
      ).pinned_channels || {};

    var pinned_channels = [];
    var non_pinned_channels_by_groups = {};
    var channels_by_groups = {};

    all_channels
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .map(channel => {
        if (pinned_channels_preferences[channel.id]) {
          pinned_channels.push(channel);
        } else {
          if (!non_pinned_channels_by_groups[channel.channel_group_name || '']) {
            non_pinned_channels_by_groups[channel.channel_group_name || ''] = [];
          }
          non_pinned_channels_by_groups[channel.channel_group_name || ''].push(channel);
        }
        if (!channels_by_groups[channel.channel_group_name || '']) {
          channels_by_groups[channel.channel_group_name || ''] = [];
        }
        channels_by_groups[channel.channel_group_name || ''].push(channel);
      });

    this.channels_by_groups = channels_by_groups;
    this.pinned_channels = pinned_channels;

    if (
      (Collections.get('channels').sources['channels_' + Workspaces.currentWorkspaceId] || {})
        .did_first_load
    ) {
      if (!window.did_remove_loading_class) {
        window.did_remove_loading_class_once = true;
        window.did_remove_loading_class = true;
        Globals.window.document.body.classList.remove('loading_render');
      }
    } else if (!window.did_remove_loading_class_once) {
      if (!window.did_add_loading_class) {
        window.did_add_loading_class = true;
        Globals.window.document.body.classList.add('loading_render');
      }
    }

    if (
      !Collections.get('channels').did_load_first_time['channels_' + Workspaces.currentWorkspaceId]
    ) {
      return (
        <div className="apps_channels loading_render">
          <ChannelCategory text="" />
          <ChannelUI text="" />
          <ChannelUI text="" />
          <ChannelUI text="" />
          <ChannelUI text="" />
        </div>
      );
    }

    return (
      <div className="workspace_channels">
        <ChannelCategory
          refAdd={node => (this.add_node = node)}
          key={'channels'}
          text={Languages.t(
            'scenes.app.channelsbar.channelsworkspace.channel_title',
            [],
            'CHAÎNES',
          )}
          onAdd={
            WorkspaceUserRights.hasWorkspacePrivilege() &&
            (() => {
              this.addChannel();
            })
          }
        />

        {pinned_channels.length > 0 &&
          pinned_channels.map(channel => (
            <Channel key={channel.front_id} channel={channel} pinned />
          ))}

        {!!WorkspaceUserRights.hasWorkspacePrivilege() && !non_pinned_channels_by_groups[''] && (
          <ChannelDroppableZone
            text={'Add here'}
            onDrop={data => {
              ChannelsService.pinChannel(data.data, false);
              this.moveChannelToGroup(data.data, '');
            }}
          />
        )}

        {pinned_channels.length > 0 && <div style={{ marginTop: 16 }} />}

        {Object.keys(non_pinned_channels_by_groups)
          .sort((a, b) => a.localeCompare(b))
          .map((id, i) => {
            return (
              <div key={'categ_' + id}>
                {id && (
                  <ChannelCategory
                    key={id}
                    text={id}
                    editable={!!WorkspaceUserRights.hasWorkspacePrivilege()}
                    sub
                    onClick={evt => {
                      this.editGroupName(evt, id);
                    }}
                  />
                )}
                {non_pinned_channels_by_groups[id].map(channel => (
                  <Channel key={channel.front_id} channel={channel} />
                ))}
                {!!WorkspaceUserRights.hasWorkspacePrivilege() && (
                  <ChannelDroppableZone
                    text={'Add here'}
                    onDrop={data => {
                      ChannelsService.pinChannel(data.data, false);
                      console.log(data);
                      this.moveChannelToGroup(data.data, id);
                    }}
                  />
                )}
              </div>
            );
          })}

        {!!WorkspaceUserRights.hasWorkspacePrivilege() &&
          Object.keys(non_pinned_channels_by_groups).length > 0 && (
            <ChannelDroppableZone
              text={'New group'}
              onDrop={data => {
                ChannelsService.pinChannel(data.data, false);
                this.moveChannelToGroup(data.data, false);
              }}
            />
          )}

        {(Collections.get('channels').sources['channels_' + Workspaces.currentWorkspaceId] || {})
          .did_first_load &&
          all_channels.length == 0 && (
            <div className="channel_small_text">
              {Languages.t(
                'scenes.app.channelsbar.channelsworkspace.no_channel',
                [],
                'Aucune chaîne dans cet espace de travail !',
              )}
            </div>
          )}
      </div>
    );
  }
}

*/
