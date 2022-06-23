import React from 'react';
import { ComponentStory } from '@storybook/react';
import Input from './input';

export default {
  title: '@atoms/input',
};

const Template: ComponentStory<any> = (props: {
  text: string;
  disabled: boolean;
  loading: boolean;
}) => {
  return (
    <>
      <Input disabled={props.disabled} label="With label" placeholder="Awesome text" />
      <br />
      <Input disabled={props.disabled} placeholder="Awesome text" value={props.text} />
      <br />
      <Input
        disabled={props.disabled}
        hasError
        label="Label and feedback"
        feedback="The feedback"
        placeholder="Awesome text"
        value={props.text}
      />
      <br />
      <Input
        disabled={props.disabled}
        label="Multi-line"
        feedback="Some non-error feedback"
        placeholder="Awesome text area"
        value={props.text}
      />
      <br />
    </>
  );
};

export const Default = Template.bind({});
Default.args = {
  text: 'Text',
  disabled: false,
};
