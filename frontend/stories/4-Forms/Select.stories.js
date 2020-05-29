import React, { Component } from 'react';
import '../stories.scss';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';
import { withState } from '@dump247/storybook-state';

import ComponentDoc from 'components/ComponentsTester/ComponentDoc.js';
import MenusBodyLayer from 'components/Menus/MenusBodyLayer.js';

import RepetitionSelector from 'components/Calendar/RepetitionSelector/RepetitionSelector.js';
import Select from 'components/Select/Select.js';

const stories = storiesOf('Forms|Select', module);
stories.addDecorator(withKnobs);

stories.add(
  'Select',
  withState({ value: 'select1' })(({ store }) => (
    <ComponentDoc
      title="Select"
      import="import Select from 'components/Select/Select.js'"
      properties={[
        ['big', 'boolean', 'false', 'Set button to big size (64px)'],
        ['medium', 'boolean', 'true', 'Set button to medium size (40px)'],
        ['small', 'boolean', 'false', 'Set button to small size (32px)'],
        ['options', 'String', '---', 'Set text and value to the select'],
      ]}
      infos={'-'}
    >
      <div className="">
        <Select
          className="small bottom-margin"
          options={[
            {
              text: 'Select 1',
              value: 'select1',
            },
            {
              text: 'Select 2',
              value: 'select2',
            },
          ]}
          value={store.state.value}
          onChange={v => {
            store.set({ value: v });
          }}
        />
        <br />

        <Select
          className="medium bottom-margin"
          options={[
            {
              text: 'Select 1',
              value: 'select1',
            },
            {
              text: 'Select 2',
              value: 'select2',
            },
          ]}
          value={store.state.value}
          onChange={v => {
            store.set({ value: v });
          }}
        />
        <br />

        <Select
          className="big bottom-margin"
          options={[
            {
              text: 'Select 1',
              value: 'select1',
            },
            {
              text: 'Select 2',
              value: 'select2',
            },
          ]}
          value={store.state.value}
          onChange={v => {
            store.set({ value: v });
          }}
        />
      </div>

      <MenusBodyLayer key="MenusBodyLayer" />
    </ComponentDoc>
  )),
);
