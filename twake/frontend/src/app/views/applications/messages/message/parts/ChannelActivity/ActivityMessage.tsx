import React from 'react';
import { Row, Typography } from 'antd';
import Languages from 'app/features/global/services/languages-service';
import Emojione from 'app/components/emojione/emojione';
import User from 'app/components/twacode/blocks/user';
import { ChannelType } from 'app/features/channels/types/channel';
import { TabType } from 'app/features/tabs/types/tab';
import { getCompanyApplications } from 'app/features/applications/state/company-applications';
import Groups from 'app/deprecated/workspaces/groups.js';
import { ChannelMemberType } from 'app/features/channel-members/types/channel-member-types';
import { MessageWithReplies } from 'app/features/messages/types/message';
import { Application } from 'app/features/applications/types/application';

enum ChannelActivityEnum {
  CHANNEL_MEMBER_CREATED = 'channel:activity:member:created',
  CHANNEL_MEMBER_DELETED = 'channel:activity:member:deleted',
  CHANNEL_UPDATED = 'channel:activity:updated',
  CHANNEL_TAB_CREATED = 'channel:activity:tab:created',
  CHANNEL_TAB_DELETED = 'channel:activity:tab:deleted',
  CHANNEL_CONNECTOR_CREATED = 'channel:activity:connector:created',
  CHANNEL_CONNECTOR_DELETED = 'channel:activity:connector:deleted',
}

export type ActivityType = {
  type: ChannelActivityEnum;
  actor: {
    type: 'user';
    id: string;
  };
  context: {
    type: 'add' | 'diff' | 'remove';
    array?: {
      type: string;
      resource: ChannelMemberType | TabType;
    }[];
    previous?: {
      type: string;
      // should be a real type instead
      resource: { id: string; name: string; description: string; icon: string };
    };
    next?: {
      type: string;
      // should be a real type instead
      resource: { id: string; name: string; description: string; icon: string };
    };
  };
};

type PropsType = {
  refDom?: React.Ref<HTMLDivElement>;
  activity: ActivityType;
  message: MessageWithReplies;
};

// i18n but with react nodes as replacements
// TODO: maybe there is betters ways to do it with lodash
const translateUsingReactNode = (key: string, replacements: JSX.Element[]): JSX.Element[] => {
  let temp =
    Languages.t(
      key,
      replacements.map((_, i) => `{${i}}`),
    ) || '';
  const list: JSX.Element[] = [];
  replacements.forEach((replacement, i) => {
    const split = temp.split(`{${i}}`);
    list.push(
      <Typography.Text key={i} type="secondary">
        {split[0]}
      </Typography.Text>,
    );
    list.push(replacement);
    temp = split[1];
  });
  list.push(
    <Typography.Text key={key + 'b'} type="secondary">
      {temp}
    </Typography.Text>,
  );
  return list;
};

export default (props: PropsType): JSX.Element => {
  const generateTypographyName = (id: string) => <User id={id} username="Unknown" hideUserImage />;
  const message = props.message;

  const memberJoinedOrInvited = (activity: ActivityType) => {
    if (activity.context.array) {
      const resource = activity.context.array[0]?.resource as ChannelMemberType;

      if (activity.actor.id === resource.user_id) {
        return [<></>]; //Do not show this information to not polute the chat
      }

      if (activity.actor.id !== resource.user_id) {
        return translateUsingReactNode(
          'scenes.apps.messages.message.activity_message.a_added_b_to_the_channel',
          [
            <span key={message.id + '-1'} style={{ marginRight: 5, lineHeight: 0 }}>
              {generateTypographyName(activity.actor.id)}
            </span>,
            <span key={message.id + '-2'} style={{ margin: '0 5px', lineHeight: 0 }}>
              {generateTypographyName(resource.user_id || '')}
            </span>,
          ],
        );
      }
    }
  };

  const memberLeftOrRemoved = (activity: ActivityType) => {
    if (activity.context.array) {
      const resource = activity.context.array[0]?.resource as ChannelMemberType;
      if (activity.actor.id === resource.user_id) {
        return []; //Do not show this information to not polute the chat
      }

      if (activity.actor.id !== resource.user_id) {
        return translateUsingReactNode(
          'scenes.apps.messages.message.activity_message.a_removed_b_from_the_channel',
          [
            <span key={message.id + '-3'} style={{ marginRight: 5, lineHeight: 0 }}>
              {generateTypographyName(activity.actor.id)}
            </span>,
            <span key={message.id + '-4'} style={{ margin: '0 5px', lineHeight: 0 }}>
              {generateTypographyName(resource.user_id || '')}
            </span>,
          ],
        );
      }
    }
  };

  const channelNameOrDescription = (activity: ActivityType) => {
    const previous = activity.context.previous;
    const next = activity.context.next;

    if (
      previous?.resource?.name !== next?.resource?.name ||
      previous?.resource?.icon !== next?.resource?.icon
    ) {
      const icon = <Emojione type={next?.resource.icon || ''} />;

      return translateUsingReactNode(
        'scenes.apps.messages.message.activity_message.a_updated_channel_name',
        [
          <span key={message.id + '-5'} style={{ marginRight: 5, lineHeight: 0 }}>
            {generateTypographyName(activity.actor.id)}
          </span>,
          <Typography.Text key={message.id + '-6'} strong style={{ margin: '0 5px' }}>
            {icon} {next?.resource?.name}
          </Typography.Text>,
        ],
      );
    }

    if (previous?.resource.description !== next?.resource.description) {
      return translateUsingReactNode(
        'scenes.apps.messages.message.activity_message.a_updated_channel_description',
        [
          <span key={message.id + '-7'} style={{ marginRight: 5, lineHeight: 0 }}>
            {generateTypographyName(activity.actor.id)}
          </span>,
        ],
      );
    }
  };

  const channelTabCreatedOrDeleted = (activity: ActivityType) => {
    if (activity.context.array) {
      const resource = activity.context.array[0].resource as TabType;
      const connector = getCompanyApplications(Groups.currentGroupId).filter(
        (app: Application) => app.id === resource.application_id,
      );

      if (activity.context.type === 'add') {
        return translateUsingReactNode(
          'scenes.apps.messages.message.activity_message.a_created_channel_tab',
          [
            <span key={message.id + '-8'} style={{ marginRight: 5, lineHeight: 0 }}>
              {generateTypographyName(activity.actor.id)}
            </span>,
            <Typography.Text key={message.id + '-9'} strong style={{ margin: '0 5px' }}>
              {connector[0]?.identity?.name}
            </Typography.Text>,
            <Typography.Text key={message.id + '-10'} strong style={{ marginLeft: 5 }}>
              {resource?.name}
            </Typography.Text>,
          ],
        );
      }

      if (activity.context.type === 'remove') {
        return translateUsingReactNode(
          'scenes.apps.messages.message.activity_message.a_deleted_channel_tab',
          [
            <span key={message.id + '-11'} style={{ marginRight: 5, lineHeight: 0 }}>
              {generateTypographyName(activity.actor.id)}
            </span>,
            <Typography.Text key={message.id + '-12'} strong style={{ margin: '0 5px' }}>
              {connector[0]?.identity?.name}
            </Typography.Text>,
            <Typography.Text key={message.id + '-13'} strong style={{ marginLeft: 5 }}>
              {resource?.name}
            </Typography.Text>,
          ],
        );
      }
    }
  };

  const channelConnectorCreatedOrDeleted = (activity: ActivityType) => {
    if (activity.context.array) {
      const resource = activity.context.array[0].resource as ChannelType;
      const connector = getCompanyApplications(Groups.currentGroupId).filter((app: Application) =>
        resource.connectors?.includes(app.id),
      );

      if (connector.length) {
        if (activity.context.type === 'add') {
          return translateUsingReactNode(
            'scenes.apps.messages.message.activity_message.a_created_channel_connector',
            [
              <span key={message.id + '-14'} style={{ marginRight: 5, lineHeight: 0 }}>
                {generateTypographyName(activity.actor.id)}
              </span>,
              <Typography.Text key={message.id + '-15'} strong style={{ marginLeft: 5 }}>
                {connector[0]?.identity?.name}
              </Typography.Text>,
            ],
          );
        }

        if (activity.context.type === 'remove') {
          return translateUsingReactNode(
            'scenes.apps.messages.message.activity_message.a_deleted_channel_connector',
            [
              <span key={message.id + '-16'} style={{ marginRight: 5, lineHeight: 0 }}>
                {generateTypographyName(activity.actor.id)}
              </span>,
              <Typography.Text key={message.id + '-17'} strong style={{ marginLeft: 5 }}>
                {connector[0]?.identity?.name}
              </Typography.Text>,
            ],
          );
        }
      }
    }
  };

  const compute = (): string | JSX.Element[] => {
    const process = new Map<
      ChannelActivityEnum,
      (activity: ActivityType) => JSX.Element[] | undefined
    >();
    process
      .set(ChannelActivityEnum.CHANNEL_MEMBER_CREATED, memberJoinedOrInvited)
      .set(ChannelActivityEnum.CHANNEL_MEMBER_DELETED, memberLeftOrRemoved)
      .set(ChannelActivityEnum.CHANNEL_UPDATED, channelNameOrDescription)
      .set(ChannelActivityEnum.CHANNEL_TAB_CREATED, channelTabCreatedOrDeleted)
      .set(ChannelActivityEnum.CHANNEL_TAB_DELETED, channelTabCreatedOrDeleted)
      .set(ChannelActivityEnum.CHANNEL_CONNECTOR_CREATED, channelConnectorCreatedOrDeleted)
      .set(ChannelActivityEnum.CHANNEL_CONNECTOR_DELETED, channelConnectorCreatedOrDeleted);

    const method = process.get(props.activity?.type) || (() => undefined);
    return method(props.activity) || '';
  };

  return (
    <div style={{ height: 40, paddingTop: 8 }}>
      <Row className="markdown" align="middle" justify="center" ref={props.refDom}>
        {compute()}
      </Row>
    </div>
  );
};
