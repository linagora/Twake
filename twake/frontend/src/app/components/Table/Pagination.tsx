import React from 'react';
import './Pagination.scss';

type Props = {
  large?: boolean;
  medium?: boolean;
  small?: boolean;
};

export default class Pagination extends React.Component<Props> {
  setSize() {
    if (this.props.large) return 'large';
    if (this.props.medium) return 'medium';
    if (this.props.small) return 'small';
    else return 'medium';
  }
  render() {
    return (
      <div className={'pagination full-width ' + this.setSize()}>
        <a href="#">&laquo;</a>
        <a href="#">&raquo;</a>
      </div>
    );
  }
}
