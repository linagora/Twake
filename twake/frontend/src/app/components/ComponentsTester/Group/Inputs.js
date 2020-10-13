import React, { Component } from 'react';

import Checkbox from 'components/Inputs/Checkbox.js';
import Switch from 'components/Inputs/Switch.js';
import Button from 'components/Buttons/Button.js';
import Input from 'components/Inputs/Input.js';

import StepCounter from 'components/StepCounter/StepCounter.js';
import Languages from 'services/languages/languages.js';
import { lang } from 'moment';

export default class GroupInputs extends React.Component {
  constructor() {
    super();
    this.state = {
      input: 'Example',
    };
  }
  render() {
    return [
      <div className="section">
        <div className="title">Formulaires</div>

        <div className="subtitle">className="big"</div>
        <Input
          className="big"
          value={this.state.input}
          onChange={evt => this.setState({ input: evt.target.value })}
        />
        <br />
        <Checkbox
          className="big"
          value={this.state.input}
          onChange={value => this.setState({ input: value })}
        />
        <br />
        <Switch
          className="big"
          value={this.state.input}
          onChange={value => this.setState({ input: value })}
        />
        <br />

        <div className="subtitle">className="medium"</div>
        <Input
          className="medium"
          value={this.state.input}
          onChange={evt => this.setState({ input: evt.target.value })}
        />
        <br />
        <Checkbox
          className="medium"
          value={this.state.input}
          onChange={value => this.setState({ input: value })}
        />
        <br />
        <Switch
          className="medium"
          value={this.state.input}
          onChange={value => this.setState({ input: value })}
        />
        <br />

        <div className="subtitle">className="small"</div>
        <Input
          className="small"
          value={this.state.input}
          onChange={evt => this.setState({ input: evt.target.value })}
        />
        <br />
        <Checkbox
          className="small"
          value={this.state.input}
          onChange={value => this.setState({ input: value })}
        />
        <br />
        <Switch
          className="small"
          value={this.state.input}
          onChange={value => this.setState({ input: value })}
        />
        <br />
      </div>,
      <div className="section">
        <div className="big_form">
          <StepCounter current={3} total={4} />
          <div className="title">Create my company 3/4</div>
          <div className="subtitle">
            {Languages.t(
              'scenes.app.workspaces.create_company.importations.title_1',
              [],
              'Already working with digital tools? Import or integrate your tools now!',
            )}
            <br />
            {Languages.t(
              'scenes.app.workspaces.create_company.importations.title_2',
              [],
              'No worries, you can do this later!',
            )}
          </div>

          <div className="body">
            <div className="input_with_label">
              <div className="label">What's your company name ?</div>
              <Input
                className="big full_width"
                value={this.state.company_name || ''}
                onChange={evt => this.setState({ company_name: evt.target.value })}
                placeholder="Ex : Google, Aircall, Doctolib"
              />
            </div>
          </div>

          <div className="footer">
            <Button value={Languages.t('general.back', [], 'Back')} inline />

            <Button value={Languages.t('general.continue', [], 'Continue')} primary />
          </div>
        </div>
      </div>,
    ];
  }
}
