import React from 'react';
import { ComponentStory } from '@storybook/react';
import Input, { defaultInputClassName } from './input';
import { SearchIcon } from '@heroicons/react/outline';
import { Title } from '../text';
import Select from './select';
import InputLabel from './input';

export default {
  title: '@atoms/select',
};

const Template: ComponentStory<any> = (props: {
  text: string;
  disabled: boolean;
  loading: boolean;
}) => {
  return (
    <>
      <Title>Sizes and with error</Title>
      <Select size="sm" disabled={props.disabled}>
        <option>Option 1</option>
        <option>Option 2</option>
      </Select>
      <br />
      <Select size="md" disabled={props.disabled}>
        <option>Option 1</option>
        <option>Option 2</option>
      </Select>
      <br />
      <Select size="lg" hasError disabled={props.disabled}>
        <option>Option 1</option>
        <option>Option 2</option>
      </Select>
      <br />

      <Title>Labels</Title>

      <InputLabel
        label="Some label"
        hasError
        feedback="Has error"
        inputComponent={
          <Select size="lg" hasError disabled={props.disabled}>
            <option>Option 1</option>
            <option>Option 2</option>
          </Select>
        }
      />
    </>
  );
};

export const Default = Template.bind({});
Default.args = {
  disabled: false,
};
