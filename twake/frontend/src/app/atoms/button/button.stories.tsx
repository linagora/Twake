import React from 'react';
import { ComponentStory } from '@storybook/react';
import { Button } from './button';

export default {
  title: '@atoms/button',
};

const Template: ComponentStory<any> = (props: {
  text: string;
  disabled: boolean;
  loading: boolean;
}) => {
  return (
    <>
      <Button className="m-4" disabled={props.disabled} loading={props.loading}>
        {props.text}
      </Button>
      <br />
      <Button className="m-4" theme="secondary" disabled={props.disabled} loading={props.loading}>
        {props.text}
      </Button>
      <br />
      <Button className="m-4" theme="danger" disabled={props.disabled} loading={props.loading}>
        {props.text}
      </Button>
      <br />
      <Button className="m-4" theme="default" disabled={props.disabled} loading={props.loading}>
        {props.text}
      </Button>
    </>
  );
};

export const Default = Template.bind({});
Default.args = {
  text: 'Text',
  loading: false,
  disabled: false,
};
