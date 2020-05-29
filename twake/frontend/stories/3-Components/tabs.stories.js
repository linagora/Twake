import React, { Component } from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';

import ComponentDoc from 'components/ComponentsTester/ComponentDoc.js'

import Tabs from 'components/Tabs/Tabs.js'

var stories = storiesOf('Components|Tabs', module);

stories
  .add('Simple', () => (
    <ComponentDoc title="Tabs" import="import Tabs from 'components/Tabs/Tabs.js'"
    properties={[
      ["tabs", "object", "null", "List of tabs {title: '', render: function or react element}"]
    ]}
    infos={"-"}
    >
      <Tabs tabs={[
        {
          title: "Tab 1",
          render: ()=>{
            return <div>Tab 1</div>
          }
        },
        {
          title: "Tab 2",
          render: ()=>{
            return <div>Tab 2</div>
          }
        }
      ]} />
    </ComponentDoc>
  ));
