import React, { Component } from 'react';
import Icon from 'components/Icon/Icon.js';
import Checkbox from 'components/Inputs/Checkbox.js';
import InputEnter from 'components/Inputs/InputEnter.js';
import Button from 'components/Buttons/Button.js';
import Languages from 'services/languages/languages.js';
import { lang } from 'moment';
import { listLanguages } from 'highlight.js';

export default class Checklist extends React.Component {
  constructor() {
    super();
    this.state = {
      checklist_edit: {},
    };
  }
  onChange(cl) {
    this.props.onChange && this.props.onChange(cl);
    this.setState({});
  }
  render() {
    var checklist = this.props.value || [];
    var progress =
      checklist.length > 0
        ? parseInt(
            (100 * checklist.map(e => (e.value ? 1 : 0)).reduce((a, b) => a + b)) /
              checklist.length,
          )
        : 0;

    return (
      <div className="checklist" style={{ marginTop: 8 }}>
        {checklist.length > 0 && (
          <div className="progress_bar_container">
            <span>{progress}%</span>
            <div className="progress_bar">
              <div className="progress" style={{ width: progress + '%' }} />
            </div>
          </div>
        )}

        {(checklist || []).map((item, i) => {
          if (item) {
            return (
              <div className={'checklist-row ' + (this.state.checklist_edit == i ? 'edit' : '')}>
                <div style={{ flex: 1, display: 'flex' }}>
                  <Checkbox
                    readOnly={this.props.readOnly}
                    value={item.value}
                    small
                    onChange={v => {
                      item.value = v;
                      this.onChange(checklist);
                    }}
                  />
                  {!(this.state.checklist_edit == i) && <span>{item.text}</span>}
                  {this.state.checklist_edit == i && !this.props.readOnly && (
                    <div className="checklist_element_editor">
                      <InputEnter
                        autoFocus
                        style={{ flex: 1 }}
                        small
                        className={'full_width'}
                        placeholder="-"
                        value={item.text}
                        onChange={v => {
                          item.text = v.target.value;
                          this.setState({});
                        }}
                        onEnter={() => {
                          console.log('hello close input');
                          this.state.checklist_edit = -1;
                          this.onChange(checklist);
                        }}
                      />
                    </div>
                  )}
                  {!this.props.readOnly && (
                    <Icon
                      className="edit-task"
                      type="pen"
                      onClick={() => {
                        this.state.checklist_edit = this.state.checklist_edit == i ? -1 : i;
                        this.setState({});
                      }}
                    />
                  )}
                </div>
                {!this.props.readOnly && (
                  <Icon
                    className="trash m-icon-small"
                    type="times"
                    onClick={() => {
                      checklist.splice(i, 1);
                      this.onChange(checklist);
                    }}
                  />
                )}
              </div>
            );
          }
        })}
        {!this.props.readOnly && (
          <Button
            className="small secondary-text"
            onClick={() => {
              checklist.push({ text: '', value: false });
              this.state.checklist_edit = checklist.length - 1;
              this.setState({});
            }}
          >
            <Icon type="plus" className="m-icon-small" />{' '}
            {Languages.t('scenes.apps.tasks.board.tasks.add_subtask', [], 'Ajouter une sous-tâche')}
          </Button>
        )}
      </div>
    );
  }
}
