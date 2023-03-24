import React, { Component } from 'react';

import Languages from 'app/features/global/services/languages-service';

import { Draggable } from 'react-beautiful-dnd';

import './Task.scss';
import TasksService from 'app/deprecated/Apps/Tasks/Tasks.js';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import TaskDetails from './TaskDetails.js';
import MediumPopupManager from 'app/components/modal/modal-manager';
import Icon from 'components/icon/icon.js';
import UserListManager from 'components/user-list-manager/user-list-manager';
import TagPicker from 'components/tag-picker/tag-picker.js';
import AttachmentPicker from 'components/attachment-picker/attachment-picker.js';

export default class Task extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      i18n: Languages,
    };
    Languages.addListener(this);
    Collections.get('tasks').addListener(this);
    Collections.get('tasks').listenOnly(this, [props.task.front_id]);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Collections.get('tasks').removeListener(this);
  }

  render() {
    var task = this.props.task;

    if (!task) {
      return '';
    }

    return (
      <Draggable
        draggableId={'task_' + task.front_id}
        index={TasksService.getElementIndex(task, 'tasks_' + task.list_id)}
        isDragDisabled={this.props.isDragDisabled}
      >
        {(provided, snapshot) => (
          <div
            className={'task_draggable_parent ' + (task.archived ? 'archived ' : '')}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            <div
              onClick={() => {
                MediumPopupManager.open(
                  <TaskDetails task={task} collectionKey={this.props.collectionKey} />,
                  { size: { width: 600 } },
                );
              }}
              className={
                'task task_draggable noselect ' + (snapshot.isDragging ? 'isDragging ' : '')
              }
            >
              <div className="task_line_1">
                <div className="task_title">
                  {task.title}
                  &nbsp;&nbsp;
                  <TagPicker
                    className="tags-in-name"
                    inline
                    canCreate={false}
                    readOnly
                    value={task.tags}
                  />
                </div>
                <div className="task_options">
                  <Icon className="m-icon-small" type="ellipsis-h" />
                </div>
              </div>

              {!!task.attachments && task.attachments.length > 0 && (
                <AttachmentPicker readOnly attachments={task.attachments} />
              )}

              {!!(
                task.description ||
                (task.attachments && task.attachments.length) ||
                (!!task.checklist && task.checklist.length > 0)
              ) && (
                <div className="task_line_2">
                  {!!task.description &&
                    task.description.original_str &&
                    task.description.original_str.trim() && (
                      <div className="task_info">
                        <Icon className="m-icon-small" type="align-left" />
                      </div>
                    )}
                  {!!task.attachments && task.attachments.length > 0 && (
                    <div className="task_info">
                      <Icon className="m-icon-small" type="file" />
                    </div>
                  )}
                  {!!task.start && task.start > 0 && (
                    <div className="task_info">
                      <Icon
                        className="m-icon-small"
                        type="stopwatch"
                        style={{ color: task.start < new Date().getTime() / 1000 ? 'green' : '' }}
                      />
                    </div>
                  )}
                  {!!task.before && task.before > 0 && (
                    <div className="task_info">
                      <Icon
                        className="m-icon-small"
                        type="stopwatch-slash"
                        style={{
                          color:
                            task.before < new Date().getTime() / 1000
                              ? 'red'
                              : task.before < new Date().getTime() / 1000 + 7 * 24 * 60 * 60
                              ? 'orange'
                              : '',
                        }}
                      />
                    </div>
                  )}
                  {!!task.checklist && task.checklist.length > 0 && (
                    <div className="task_info">
                      <Icon className="m-icon-small" type="check-square" />
                      <span>
                        {' '}
                        {parseInt(
                          (100 *
                            task.checklist.map(e => (e.value ? 1 : 0)).reduce((a, b) => a + b)) /
                            task.checklist.length,
                        )}
                        %
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="task_line_tags">
                <TagPicker canCreate={false} readOnly value={task.tags} />
              </div>

              {!!task.participants && task.participants.length > 0 && (
                <div className="task_users">
                  <UserListManager
                    users={(task.participants || []).map(participant => {
                      return { id: participant.user_id_or_mail };
                    })}
                    readOnly
                    collapsed
                    medium
                  />
                </div>
              )}
              <div style={{ clear: 'both' }} />
            </div>
          </div>
        )}
      </Draggable>
    );
  }
}
