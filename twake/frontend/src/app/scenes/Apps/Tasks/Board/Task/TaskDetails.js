import React, { Component } from 'react';
import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import UserListManager from 'components/UserListManager/UserListManager.js';
import Button from 'components/Buttons/Button.js';
import Menu from 'components/Menus/Menu.js';
import TagPicker from 'components/TagPicker/TagPicker.js';
import TasksService from 'services/Apps/Tasks/Tasks.js';
import TaskEditor from './TaskEditor.js';
import MediumPopupManager from 'services/mediumPopupManager/mediumPopupManager.js';
import Checklist from './Parts/Checklist.js';
import {
  ObjectModal,
  ObjectModalFormTitle,
  ObjectModalTitle,
} from 'components/ObjectModal/ObjectModal.js';
import Twacode from 'components/Twacode/Twacode';
import AttachmentPicker from 'components/AttachmentPicker/AttachmentPicker.js';
import moment from 'moment';
import './Modal.scss';

export default class TaskDetails extends React.Component {
  constructor() {
    super();
    this.state = {
      i18n: Languages,
    };
    Languages.addListener(this);
  }
  componentWillUnmount() {
    this.update_timeout && clearTimeout(this.update_timeout);
    Languages.removeListener(this);
  }
  remove() {
    TasksService.remove(this.props.task, this.props.collectionKey);
  }
  archive() {
    TasksService.archive(this.props.task, this.props.collectionKey);
  }
  unarchive() {
    TasksService.unarchive(this.props.task, this.props.collectionKey);
  }
  changeTags(tags) {
    this.props.task.tags = tags;
    Collections.get('tasks').updateObject(this.props.task);
    this.setState({});
    this.changeTask();
  }
  changeParticipants(pa) {
    this.props.task.participants = pa;
    Collections.get('tasks').updateObject(this.props.task);
    this.changeTask();
  }
  changeChecklist(cl) {
    this.props.task.checklist = cl;
    Collections.get('tasks').updateObject(this.props.task);
    this.changeTask();
  }
  changeTask(notify) {
    if (notify || notify === undefined) {
      this.update_timeout && clearTimeout(this.update_timeout);
      this.update_timeout = setTimeout(() => {
        Collections.get('tasks').save(this.props.task, this.props.collectionKey);
      }, 1000);
      this.setState({});
    }
  }
  edit() {
    var task = this.props.task;
    TasksService.edited = Collections.get('tasks').editCopy(task);
    MediumPopupManager.open(
      <TaskEditor
        task={TasksService.edited}
        collectionKey={this.props.collectionKey}
        onChange={task => {
          console.log(task);
        }}
      />,
      { size: { width: 600 } },
    );
  }
  render() {
    var task = this.props.task;
    var readonly = false;

    var list = Collections.get('lists').find(task.list_id) || {};

    return (
      <ObjectModal
        className="taskModal task_details"
        onClose={() => MediumPopupManager.closeAll()}
        onEdit={
          readonly
            ? false
            : () => {
                this.edit();
              }
        }
        footer={
          <div>
            {!readonly && (
              <div>
                <Button
                  className="danger small right-margin"
                  style={{ width: 'auto' }}
                  onClick={() => {
                    this.remove();
                  }}
                >
                  {Languages.t('general.remove', [], 'Supprimer')}
                </Button>
                <Button
                  className="secondary-light small"
                  style={{ width: 'auto' }}
                  onClick={() => {
                    task.archived ? this.unarchive() : this.archive();
                  }}
                >
                  {task.archived
                    ? Languages.t('general.unarchive', [], 'Désarchiver')
                    : Languages.t('general.archive', [], 'Archiver')}
                </Button>

                {!task.archived && (
                  <Button
                    className="small secondary-light"
                    style={{ width: 'auto', float: 'right' }}
                    onClick={() => {
                      this.edit();
                    }}
                  >
                    {Languages.t('general.edit', [], 'Editer')}
                  </Button>
                )}
              </div>
            )}
          </div>
        }
        title={
          <div className="title allow_selection">
            <ObjectModalTitle>{task.title || ''}</ObjectModalTitle>
            {list.title && (
              <div className="text">
                {Languages.t('scenes.apps.tasks.board.tasks.in_list', [], 'In list')}{' '}
                <a>{list.title}</a>
              </div>
            )}
          </div>
        }
      >
        <TagPicker
          readOnly={task.archived}
          canCreate={true}
          value={task.tags}
          onChange={values => {
            this.changeTags(values);
          }}
        />

        {!!task.description &&
          task.description.original_str &&
          task.description.original_str.trim() && (
            <div className="text allow_selection" style={{ marginTop: -16 }}>
              <ObjectModalFormTitle
                name={Languages.t('scenes.apps.tasks.task.description', [], 'Description')}
                icon="align-left"
              />
              <Twacode className="allow_selection" content={task.description} />
            </div>
          )}

        <ObjectModalFormTitle
          name={Languages.t('scenes.apps.tasks.board.tasks.subtask', [], 'Sous-tâches')}
          icon="check-square"
        />
        <Checklist
          value={task.checklist}
          readOnly={task.archived}
          onChange={val => {
            this.changeChecklist(val);
          }}
        />

        <ObjectModalFormTitle
          name={Languages.t('scenes.apps.tasks.task.assignees', [], 'Assignés')}
          icon="users-alt"
        />
        <UserListManager
          readOnly={task.archived}
          showAddMe
          showAddAll
          canRemoveMyself
          noPlaceholder
          users={(task.participants || []).map(participant => {
            return { id: participant.user_id_or_mail };
          })}
          scope="workspace"
          onUpdate={ids_mails => {
            this.changeParticipants(
              ids_mails.map(id => {
                return { user_id_or_mail: id };
              }),
            );
            Menu.closeAll();
          }}
        />

        <ObjectModalFormTitle
          name={Languages.t('scenes.apps.tasks.modals.attachments', [], 'Pièces jointes')}
          icon="paperclip"
        />
        <AttachmentPicker readOnly attachments={task.attachments} />

        <ObjectModalFormTitle
          name={Languages.t('scenes.app.header.alt_notifications', [], 'Notifications')}
          icon="bell"
        />
        <span className="text">
          {!!task.start && task.start > 0 && (
            <span>
              {Languages.t('scenes.apps.tasks.board.starts', [], 'Démarre le')}{' '}
              {moment(new Date(task.start * 1000)).format('L LT')}.{' '}
            </span>
          )}
          <br />
          {!!task.before && task.before > 0 && (
            <span>
              {Languages.t('scenes.apps.tasks.board.ends', [], 'À terminer avant le')}{' '}
              {moment(new Date(task.before * 1000)).format('L LT')}.{' '}
            </span>
          )}
        </span>

        <br />
        <br />
      </ObjectModal>
    );
  }
}
