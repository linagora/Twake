import React, {Component} from 'react';
import Collections from 'services/Collections/Collections.js';
import Emojione from 'components/Emojione/Emojione.js';

export default class CHan extends React.Component {
  render() {
    if (!this.props.id || !Collections.get('channels').find(this.props.id)) {
      return <div className="channel_twacode unknown">#{this.props.name}</div>;
    }

    var chan = Collections.get('channels').find(this.props.id);
    return (
      <div className="channel_twacode">
        <Emojione type={chan.icon} />
        {chan.name}
      </div>
    );
  }
}
