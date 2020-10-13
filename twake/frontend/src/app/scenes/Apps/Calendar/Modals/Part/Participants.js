import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import UserListManager from 'components/UserListManager/UserListManager.js';
import Menu from 'components/Menus/Menu.js';

export default class Participants extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className="participants">
        <div className="bottom-margin">
          <b>{Languages.t('scenes.apps.calendar.modals.part.participants', [], 'Participants')}</b>
        </div>

        <div className="menu-list">
          <UserListManager
            showAddMe
            showAddAll
            readOnly={this.props.readOnly}
            canRemoveMyself
            noPlaceholder
            users={(this.props.participants || []).map(participant => {
              return { id: participant.user_id_or_mail };
            })}
            scope="workspace"
            allowMails
            onUpdate={ids_mails => {
              console.log(
                'aze',
                ids_mails.map(id => {
                  return { user_id_or_mail: id };
                }),
              );
              this.props.onChange &&
                this.props.onChange(
                  ids_mails.map(id => {
                    return { user_id_or_mail: id };
                  }),
                );
              Menu.closeAll();
            }}
          />
        </div>

        {/*
      <div className="subtitle">
        {!this.props.readOnly &&
          <Menu menu={[
            {type:"react-element", reactElement: ()=>{
              return <UserListManager canRemoveMyself users={(this.props.participants || []).map((participant)=>{return {id: participant.user_id_or_mail}})} scope="workspace" allowMails onCancel={()=>{Menu.closeAll();}} onChange={(ids_mails)=>{
                this.props.onChange && this.props.onChange(ids_mails.map((id)=>{ return {user_id_or_mail: id} }));
                Menu.closeAll();
              }} />;
            }}
          ]}>
            <Button className="button medium secondary medium" style={{float: "right", marginTop: 0}}>Editer</Button>
          </Menu>
        }

        Participants
      </div>


      {(this.props.participants || []).map((participant)=>{
        return (
          <div className="participant">
            <UserOrMail item={participant.user_id_or_mail || ""} /> {participant.user_id_or_mail==UsersService.getCurrentUserId() && " (Vous)"}{participant.user_id_or_mail == this.props.owner && " (Propriétaire)"}
          </div>
        );
      })}

      {(this.props.participants || []).length == 0 && "Aucun participant."}
*/}
      </div>
    );
  }
}
