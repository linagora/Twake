import React from 'react';
import Emojione from 'components/Emojione/Emojione';
import Button from 'components/Buttons/Button';
import Languages from 'services/languages/languages';
import User from 'components/User/User';
import UserService from 'services/user/UserService';
import { UserType } from 'app/models/User';
import './UserCard.scss';

type PropsType = {
  user: UserType;
  onClick: (evt: any) => {}
};

export default (props: PropsType): JSX.Element => {
  return (
    <div className="user-card allow_selection">
      <div className="content-popup small-bottom-margin">
        <div className="avatar">
          <User withStatus big user={props.user} />
        </div>
        <div className="texts">
          <div className="text-ellipsis title">{UserService.getFullName(props.user)}</div>
          <div className="text-ellipsis">{`@${(props.user || {}).username || ''}`}</div>
        </div>
      </div>
      <div className="mail-container small-y-margin">
        <Emojione type=":envelope_with_arrow:" />
        <a href={`mailto:${props.user.email}`}>{props.user.email}</a>
      </div>
      <div className="footer">
        <Button
          type="button"
          value={Languages.t('general.send', 'Save')}
          onClick={props.onClick}
        />
      </div>
    </div>
  );
};
