import React, { Component } from 'react';
import Select from 'components/Select/Select.js';
import Languages from 'services/languages/languages.js';
import moment from 'moment';
import MediumPopupManager from 'services/mediumPopupManager/mediumPopupManager.js';
import Repetitionpopup from 'components/Calendar/RepetitionSelector/RepetitionPopup.js';

export default class RepetitionSelector extends React.Component {
  constructor(props) {
    super();
    this.props = props;
    console.log(this.props.rrule);

    this.state = {
      value: this.props.value,
      date: this.props.date,
      // rruleObject: rrulestr(this.props.rrule).options,
      i18n: Languages,
    };

    Languages.addListener(this);
    this.options = [
      {
        // "text": moment(this.state.date).format(),
        text: Languages.t('components.calendar.repetition.does_not_repeat'),
        value: 'select1',
      },
      {
        text: Languages.t('components.calendar.repetition.everyday'),
        value: 'DTSTART:' + moment(this.state.date).format() + '\nRRULE:FREQ=WEEKLY',
      },
      {
        text: Languages.t('components.calendar.repetition.weekly_on', [
          moment(this.state.date).format('dddd'),
        ]),
        value:
          'DTSTART:' +
          moment(this.state.date).format() +
          '\nRRULE:FREQ=WEEKLY;BYDAY=' +
          moment(this.state.date).format('dd').toUpperCase(),
      },
      {
        text: Languages.t('components.calendar.repetition.monthly_on', [
          moment
            .localeData()
            .ordinal(
              moment(this.state.date).week() - moment(this.state.date).startOf('month').week() + 1,
            ),
          moment(this.state.date).format('dddd'),
        ]),
        value:
          'DTSTART:' +
          moment(this.state.date).format() +
          '\nFREQ=MONTHLY;BYDAY=+' +
          (moment(this.state.date).week() - moment(this.state.date).startOf('month').week() + 1) +
          moment(this.state.date).format('dd').toUpperCase(),
      },
      {
        text: Languages.t('components.calendar.repetition.annually_on', [
          moment(this.state.date)
            .format('LL')
            .replace(moment(this.state.date).format('YYYY'), '')
            .replace(/,/, ''),
        ]),
        value:
          'DTSTART:' +
          moment(this.state.date).format() +
          '\nRRULE:FREQ=YEARLY;BYMONTH=' +
          moment(this.state.date).format('M') +
          ';BYMONTHDAY=' +
          moment(this.state.date).format('M'),
      },
      {
        text: Languages.t('components.calendar.repetition.every_weekday'),
        value:
          'DTSTART:' +
          moment(this.state.date).format() +
          '\nRRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
      },
    ];
    console.log('LAAAAAA');

    if (this.props.rrule !== undefined) {
      this.options.push({
        text: Languages.t('components.calendar.repetition.custom'),
        value: this.props.rrule + 'customSelect',
      });
    } else {
      this.options.push({
        text: Languages.t('components.calendar.repetition.custom'),
        value: 'customSelect',
      });
    }
  }
  render() {
    console.log(this.state.value, this.state.date);
    return (
      <div>
        <Select
          className="big bottom-margin"
          options={this.options}
          value={this.state.value}
          onChange={v => {
            console.log(v);
            if (v.includes('customSelect')) {
              console.log('Avant', this.state.date);
              MediumPopupManager.open(
                <Repetitionpopup date={this.state.date} value={'RRule.DAILY'} />,
                {
                  position: 'center',
                  size: {
                    width: '400px',
                  },
                },
              );
            }
            this.setState({ value: v });
          }}
        />
      </div>
    );
  }
}
