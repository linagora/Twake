import React from "react";
import { MentionSuggestionType } from "./index";
import UsersService from 'services/user/UserService';
import User from 'components/User/User';

export default (props: MentionSuggestionType): JSX.Element => {
  return (
    <>
      <div className="icon">
        <User user={props} small />
      </div>
      <div className="text">
        {UsersService.getFullName(props)}{' '}
        <span style={{ opacity: '0.5', textTransform: 'capitalize' }}>@{props.username}</span>
      </div>
    </>
  );
};
