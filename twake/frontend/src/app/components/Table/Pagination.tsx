import React from 'react';
import './Pagination.scss';

type Props = {
  large?: boolean;
  medium?: boolean;
  small?: boolean;
  page?: number;
  previousPage?: false | (() => void);
  firstPage?: false | (() => void);
  nextPage?: false | (() => void);
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
        {!!this.props.previousPage && (
          <a href="#" onClick={this.props.previousPage}>
            Page précédente
          </a>
        )}
        {!!this.props.nextPage && (
          <a href="#" onClick={this.props.nextPage}>
            Afficher plus
          </a>
        )}
      </div>
    );
  }
}
