import React from 'react';
import { Tooltip, Avatar, Badge } from 'antd';

import './Channel.scss';

import Emojione from 'components/Emojione/Emojione';
import Icon from 'components/Icon/Icon.js';
// import User from 'components/User/User.js';
// import Draggable from 'components/Draggable/Draggable.js';
// import Tooltip from 'components/Tooltip/Tooltip.js';
// import Languages from 'services/languages/languages.js';

type Props = {
  name: string;
  icon: string; // string || url || react.component
  selected: boolean;
  muted: boolean;
  favorite: boolean;
  unreadMessages: boolean;
  visibility: string; //"private" | "public" | "direct"
  directMembers?: string[];
  notifications: number;
  options: object;
  onClick?: (evt: any) => void;
};

export default class Channel extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div
        className={'channel fade_in ' + (this.props.selected ? 'selected ' : '')}
        onClick={this.props.onClick}
      >
        {this.props.visibility === 'direct' &&
          this.props.directMembers &&
          this.props.directMembers.length === 1 && (
            <Badge dot offset={[-6, 20]}>
              <Avatar
                size={25}
                src={
                  'https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairTheCaesar&accessoriesType=Prescription02&hairColor=Black&facialHairType=BeardLight&facialHairColor=Black&clotheType=BlazerShirt&eyeType=Side&eyebrowType=Default&mouthType=Default&skinColor=Light'
                }
              />
            </Badge>
          )}
        {this.props.visibility === 'direct' &&
          this.props.directMembers &&
          this.props.directMembers.length > 1 && (
            <Avatar.Group
              maxCount={3}
              maxStyle={{
                color: '#FFFFFF',
                backgroundColor: '#837DFF',
                width: '25px',
                height: '25px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Avatar
                size={25}
                src={
                  'https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairTheCaesar&accessoriesType=Prescription02&hairColor=Black&facialHairType=BeardLight&facialHairColor=Black&clotheType=BlazerShirt&eyeType=Side&eyebrowType=Default&mouthType=Default&skinColor=Light'
                }
              />
              <Avatar
                size={25}
                src={
                  'https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairTheCaesar&accessoriesType=Prescription02&hairColor=Black&facialHairType=BeardLight&facialHairColor=Black&clotheType=BlazerShirt&eyeType=Side&eyebrowType=Default&mouthType=Default&skinColor=Light'
                }
              />
              <Avatar
                size={25}
                src={
                  'https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairTheCaesar&accessoriesType=Prescription02&hairColor=Black&facialHairType=BeardLight&facialHairColor=Black&clotheType=BlazerShirt&eyeType=Side&eyebrowType=Default&mouthType=Default&skinColor=Light'
                }
              />
              <Tooltip title="Ant User" placement="top">
                <Avatar
                  size={25}
                  src={
                    'https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairTheCaesar&accessoriesType=Prescription02&hairColor=Black&facialHairType=BeardLight&facialHairColor=Black&clotheType=BlazerShirt&eyeType=Side&eyebrowType=Default&mouthType=Default&skinColor=Light'
                  }
                />
              </Tooltip>
            </Avatar.Group>
          )}
        {(this.props.visibility === 'public' || this.props.visibility === 'private') && (
          <div className="icon">
            <Emojione type={this.props.icon} />
          </div>
        )}

        <div className="text">{this.props.name}</div>
        <div className="more">
          {this.props.visibility === 'private' && <Icon type="lock merge-icon black-icon" />}
          {this.props.muted && <Icon type="bell-slash merge-icon grey-icon" />}
          {this.props.notifications > 0 && (
            <div className="notification_dot">{Math.max(1, this.props.notifications)}</div>
          )}
          <div className="more-icon">
            <Icon type="ellipsis-h more-icon grey-icon" />
          </div>
        </div>
      </div>

      // <Draggable
      //   className={
      //     'channel fade_in ' +
      //     (!!this.props.selected ? 'selected ' : '') +
      //     (!!this.props.muted ? 'muted ' : '') +
      //     (!!this.props.alinea ? 'extra-margin ' : '') +
      //     (this.props.notifications > 0 ? 'has_notifications ' : '') +
      //     (this.props.hasNewContent > 0 ? 'has_new_content ' : '')
      //   }
      //   parentClassOnDrag="dragging_channel_view"
      //   minMove={5}
      //   data={{ type: 'channel', data: this.props.dragData }}
      //   onClick={this.props.onClick}
      //   deactivated={!this.props.draggable}
      //   refDraggable={this.props.refDiv}
      // >
      //   {this.props.favorite && (
      //     <div className="favorite">
      //       <Icon type="star" />
      //     </div>
      //   )}
      //   <div className="icon">
      //     {!!this.props.icon && <Icon type={this.props.icon} />}
      //     {!!this.props.emoji && <Emojione type={this.props.emoji} />}
      //     {!!this.props.users && (
      //       <div className="user_list">
      //         {this.props.users.map(user => {
      //           return (
      //             <User key={user.front_id} user={user} withStatus={this.props.users.length == 1} />
      //           );
      //         })}
      //       </div>
      //     )}
      //   </div>
      //   {!!this.props.notMember && (
      //     <Tooltip
      //       className="not_member"
      //       tooltip={Languages.t(
      //         'scenes.apps.drive.drive_tour.left_bar.not_in_ws',
      //         [],
      //         'User not in current workspace',
      //       )}
      //       position="top"
      //     >
      //       <Icon type="external-link-alt" />
      //     </Tooltip>
      //   )}
      //   {!!this.props.appIndicator && <div className="app_indicator">APP</div>}
      //   {!!this.props.users && this.props.users.length > 1 && (
      //     <div className="group_count">{this.props.users.length}</div>
      //   )}
      //   {!!this.props.imported && (
      //     <Tooltip
      //       className="imported"
      //       tooltip={Languages.t(
      //         'scenes.apps.drive.drive_tour.left_bar.imported',
      //         [],
      //         'Imported from another workspace',
      //       )}
      //       position="top"
      //     >
      //       ({this.props.imported})
      //     </Tooltip>
      //   )}
      //   <div className="text">{this.props.text}</div>
      //   <div className="more">
      //     {!!this.props.private && <Icon type="lock merge-icon black-icon" />}
      //     {!!this.props.public && <Icon type="users-alt merge-icon grey-icon" />}
      //     {!this.props.muted && !!this.props.call && <Icon type="phone-volume green-icon" />}

      //     {this.props.notifications > 0 && (
      //       <div className="notification_dot">{Math.max(1, this.props.notifications)}</div>
      //     )}

      //     {!!this.props.muted && <Icon type="bell-slash merge-icon grey-icon" />}
      //     <div
      //       className="more-icon"
      //       onClick={evt => {
      //         evt.stopPropagation();
      //         evt.preventDefault();
      //         this.props.onClickMore && this.props.onClickMore(evt);
      //       }}
      //     >
      //       <Icon type="ellipsis-h more-icon grey-icon" />
      //     </div>
      //   </div>
      // </Draggable>
    );
  }
}
