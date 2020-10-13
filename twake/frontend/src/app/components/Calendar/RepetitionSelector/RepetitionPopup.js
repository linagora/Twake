import React, { Component } from 'react';
import './RepetitionPopup.scss';
import Input from 'components/Inputs/Input.js';
import Select from 'components/Select/Select.js';
import Languages from 'services/languages/languages.js';
import { RRule } from 'rrule';
import moment from 'moment';
import Radio from 'components/Inputs/Radio.js';
import DatePicker from 'components/Calendar/DatePicker.js';
import Button from 'components/Buttons/Button.js';

export default class RepetitionSelector extends React.Component {
  constructor(props) {
    super();
    this.props = props;
    this.state = {
      value: this.props.value,
      date: this.props.date,
      radio: 1,
      ts: this.props.date,
      i18n: Languages,
      value_monthly: 'select1' || undefined,
      every_month: undefined,
      rrule_interval: undefined,
      rrule_count: undefined,
      selected: [false, false, false, false, false, false, false],
      colorBack: '#FFFFF',
      colorFont: '#837dff',
    };
    this.days = [];
    console.log('LA DATE ', this.props.date);
    Languages.addListener(this);
    this.rule = new RRule();
    moment.updateLocale({
      week: {
        dow: 1,
      },
    });
  }

  render() {
    return (
      <div className="repetition_popup">
        <div className="title">
          {Languages.t('components.calendar.repetition.custom_recurrence')}
        </div>

        <div className="popup_line bottom-margin">
          <span className="right-margin">
            <b>{Languages.t('components.calendar.repetition.repeat')}</b>
          </span>
          <Input
            className="small right-margin"
            type="number"
            value={this.state.rrule_interval || 0}
            onChange={evt => this.setState({ rrule_interval: evt.target.value })}
          />
          <Select
            className="small"
            options={[
              {
                text: Languages.t('components.calendar.repetition.days'),
                value: 'RRule.DAILY',
              },
              {
                text: Languages.t('components.calendar.repetition.weeks'),
                value: 'RRule.WEEKLY',
              },
              {
                text: Languages.t('components.calendar.repetition.months'),
                value: 'RRule.MONTHLY',
              },
              {
                text: Languages.t('components.calendar.repetition.years'),
                value: 'RRule.YEARLY',
              },
            ]}
            value={this.state.value}
            onChange={v => {
              this.setState({ value: v });
            }}
          />
        </div>

        <div
          className="weeks bottom-margin"
          style={this.state.value != 'RRule.WEEKLY' ? { display: 'none' } : undefined}
        >
          <div className="bottom-margin">
            <b>{Languages.t('components.calendar.repetition.repeat_on')}</b>
          </div>

          <div className="week_day">
            {this.state.selected.map((i, index) => (
              <div
                className={'right-margin ' + (i == false ? 'unselectedColor' : 'selectedColor')}
                onClick={() => {
                  var list = this.state.selected;
                  if (i == true) {
                    list[index] = false;
                    this.setState({ selected: list });
                    var indice = this.days.indexOf(index);
                    this.days.splice(indice, 1);
                  } else {
                    list[index] = true;
                    this.setState({ selected: list });
                    this.days.push(index);
                  }
                  console.log('le contenu', this.days);
                }}
              >
                {moment.weekdays(true)[index][0].toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        <div
          className="bottom-margin monthly"
          style={this.state.value != 'RRule.MONTHLY' ? { display: 'none' } : undefined}
        >
          <Select
            className="small"
            options={[
              {
                text: Languages.t('components.calendar.repetition.monthly_on', [
                  moment
                    .localeData()
                    .ordinal(
                      moment(this.state.date).week() -
                        moment(this.state.date).startOf('month').week() +
                        1,
                    ),
                  moment(this.state.date).format('dddd'),
                ]),
                value: 'select1',
              },
              {
                text: Languages.t('components.calendar.repetition.monthly_on_day', [
                  moment(this.state.date).format('D'),
                ]),
                value: 'select2',
              },
            ]}
            value={this.state.value_monthly}
            onChange={v => {
              this.setState({ value_monthly: v });
            }}
          />
        </div>

        <div className="popup_line">
          <div className="bottom-margin">
            <b>{Languages.t('components.calendar.repetition.ends')}</b>
          </div>

          <div className=" bottom-margin">
            <Radio
              small
              label={Languages.t('components.calendar.repetition.never')}
              value={this.state.radio == 1}
              onChange={value => this.setState({ radio: 1 })}
            />
            <br />
          </div>

          <div className="onDate bottom-margin">
            <Radio
              small
              label={Languages.t('components.calendar.repetition.on')}
              value={this.state.radio == 2}
              onChange={value => this.setState({ radio: 2 })}
            />
            <div style={{ flex: 1 }}>
              <DatePicker
                small
                ts={this.state.ts / 1000 || new Date().getTime() / 1000}
                disabled={this.state.radio != 2}
                onChange={value => this.setState({ ts: value })}
              />
            </div>
          </div>

          <div className="after bottom-margin">
            <Radio
              small
              label={Languages.t('components.calendar.repetition.after')}
              value={this.state.radio == 3}
              onChange={value => this.setState({ radio: 3 })}
            />
            <div className="occurrence" style={{ flex: 1 }}>
              <Input
                id="count"
                disabled={this.state.radio != 3}
                className="small right-margin"
                type="number"
                value={this.state.rrule_count || 0}
                onChange={evt => this.setState({ rrule_count: evt.target.value })}
              />
              {Languages.t('components.calendar.repetition.occurrence')}
            </div>
          </div>
        </div>

        <div className="buttons">
          <Button className="small secondary-light right-margin">
            {Languages.t('general.cancel')}
          </Button>
          <Button
            className="small margin"
            onClick={() => {
              // console.log("ICI",moment(this.state.ts * 1000).format());

              if (this.days.length >= 0) {
                var byweekday = [];
                for (var i = 0; i < this.days.length; i++) {
                  switch (this.days[i]) {
                    case 0:
                      byweekday.push(RRule.MO);
                      break;
                    case 1:
                      byweekday.push(RRule.TU);
                      break;
                    case 2:
                      byweekday.push(RRule.WE);
                      break;
                    case 3:
                      byweekday.push(RRule.TH);
                      break;
                    case 4:
                      byweekday.push(RRule.FR);
                      break;
                    case 5:
                      byweekday.push(RRule.SA);
                      break;
                    case 6:
                      byweekday.push(RRule.SU);
                      break;

                    default:
                  }
                }
              }

              this.rule = new RRule({
                freq:
                  this.state.value == 'RRule.DAILY'
                    ? RRule.DAILY
                    : this.state.value == 'RRule.WEEKLY'
                    ? RRule.WEEKLY
                    : this.state.value == 'RRule.MONTHLY'
                    ? RRule.MONTHLY
                    : this.state.value == 'RRule.YEARLY'
                    ? RRule.YEARLY
                    : undefined,
                interval: this.state.rrule_interval || undefined,
                until:
                  this.state.radio == 2
                    ? new Date(moment(this.state.ts * 1000).format())
                    : undefined,
                count: this.state.radio == 3 ? this.state.rrule_count : undefined,
                byweekday:
                  this.state.value == 'RRule.MONTHLY'
                    ? [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA][
                        moment(this.state.date).day()
                      ]
                    : byweekday,
              });

              console.log(this.rule.toText());
            }}
          >
            {Languages.t('general.save')}
          </Button>
        </div>
      </div>
    );
  }
}
