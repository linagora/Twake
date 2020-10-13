import React, { Component } from 'react';
import DateSelectorInput from 'components/Calendar/DatePicker.js';
import TimeSelector from 'components/Calendar/TimeSelector.js';
import Checkbox from 'components/Inputs/Checkbox.js';
import Icon from 'components/Icon/Icon.js';
import './DateSelector.scss';
import Languages from 'services/languages/languages.js';

export default class DateSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {},
    };

    this.oldProps = JSON.stringify(props.event);
    this.updateFromProps(props);
  }
  shouldComponentUpdate(nextProps) {
    if (this.oldProps != JSON.stringify(nextProps.event)) {
      this.oldProps = JSON.stringify(nextProps.event);
      this.updateFromProps(nextProps);
    }
    return true;
  }
  change(key, value) {
    this.state.data[key] = value;

    if (key == 'from') {
      if (
        this.state.data.to < this.state.data.from ||
        (this.state.data.to - this.state.data.from > 60 * 60 * 24 * 2 && !this.state.data.all_day)
      ) {
        this.state.data.to = this.state.data.from + (this.duration || 60 * 60);
      }
    }
    if (key == 'to') {
      if (
        this.state.data.to < this.state.data.from ||
        (this.state.data.to - this.state.data.from > 60 * 60 * 24 * 2 && !this.state.data.all_day)
      ) {
        this.state.data.from = this.state.data.to - (this.duration || 60 * 60);
      }
    }
    if (key == 'all_day') {
      if (
        this.state.data.to - this.state.data.from > 60 * 60 * 24 * 2 &&
        !this.state.data.all_day
      ) {
        this.state.data.to = this.state.data.from + Math.min(this.duration || 60 * 60, 60 * 60);
      }
    }

    if (this.state.data.to > this.state.data.from) {
      this.duration = this.state.data.to - this.state.data.from;
    }

    this.setState({});
    this.update();
  }
  update() {
    var from = this.state.data.from;
    var to = this.state.data.to;

    if (this.props.event.type == 'deadline' || this.props.event.type == 'remind') {
      to = from + 15 * 60;
    }

    if (to < from) {
      to = from + 60 * 60;
    }

    var all_day = this.state.data.all_day;
    this.props.onChange && this.props.onChange(from, to, all_day, null);
  }
  updateFromProps(props) {
    this.state.data.from = props.event.from;
    this.state.data.to = props.event.to;
    this.state.data.all_day = props.event.all_day;

    if (this.state.data.to > this.state.data.from) {
      this.duration = this.state.data.to - this.state.data.from;
    }
  }
  render() {
    var event = this.props.event;
    return (
      <div className="calendar_selector">
        <div className="date_selector_full">
          <span className="clock_part" style={{ verticalAlign: 'top', display: 'inline-block' }}>
            <Icon type="clock" className="icon_clock" />
          </span>
          <div className="start">
            <DateSelectorInput
              ts={this.state.data.from}
              onChangeBlur={value => this.change('from', value)}
              className=""
            />
            {!event.all_day && (
              <TimeSelector
                ts={this.state.data.from}
                onChangeBlur={value => this.change('from', value)}
              />
            )}
          </div>
          {(!event.type || event.type == 'event' || event.type == 'move') && [
            <span className="middle">
              {Languages.t('scenes.apps.calendar.event_view.article_until')}
            </span>,
            <div className="end">
              {!event.all_day && (
                <TimeSelector
                  ts={this.state.data.to}
                  onChangeBlur={value => this.change('to', value)}
                  className=""
                />
              )}
              <DateSelectorInput
                ts={this.state.data.to}
                onChangeBlur={value => this.change('to', value)}
              />
            </div>,
          ]}
        </div>

        <div>
          <Checkbox
            small
            value={event.all_day}
            onChange={value => {
              this.change('all_day', value);
            }}
            label={Languages.t(
              'scenes.apps.calendar.event_edition.checkbox_all_day',
              [],
              'All day',
            )}
          />
        </div>
      </div>
    );
  }
}
