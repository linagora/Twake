<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
import Collections from 'services/Collections/Collections.js';
import CloseIcon from '@material-ui/icons/CloseOutlined';
import AddIcon from '@material-ui/icons/AddOutlined';
import GearIcon from '@material-ui/icons/BuildOutlined';
import Input from 'components/Inputs/Input.js';
import './ConnectorsListManager.scss';
import Languages from 'services/languages/languages.js';

export default class ConnectorsListManager extends React.Component {
  constructor(props) {
    super();
    this.props = props;
    this.state = {
      connectors_ids: props.current.map(item => item.id),
      filtered: [],
      input: '',
    };
  }
  filter(text) {
    this.state.input = text;
    var list = this.props.list;
    var res = list
      .filter(el => {
        return el.name.toLocaleLowerCase().indexOf(text.toLocaleLowerCase()) >= 0;
      })
      .map(el => el);
    this.setState({ filtered: res });
  }
  componentDidMount() {
    this.filter('');
  }
  renderLine(item, added) {
    var id = item.id || item;

    item = Collections.get('applications').find(id);

    var text = '';
    var button = '';

    text = (
      <div className="text">
        <div className="menu-app-icon" style={{ backgroundImage: 'url(' + item.icon_url + ')' }} />
        {item.name}
      </div>
    );

    if (added) {
      button = (
        <div className="more">
          {this.props.configurable && this.props.configurable(item) && (
            <GearIcon
              className="m-icon-small config"
              onClick={() => {
                this.props.onConfig(item);
              }}
            />
          )}
          <CloseIcon
            className="m-icon-small remove"
            onClick={() => {
              this.state.connectors_ids = this.state.connectors_ids.filter(id =>
<<<<<<< HEAD
                typeof item == 'string' ? item != id : item.id != id
=======
                typeof item == 'string' ? item != id : item.id != id,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              );
              this.setState({});
              this.props.onChange(this.state.connectors_ids);
            }}
          />
        </div>
      );
    } else {
      button = (
        <div className="more">
          <AddIcon
            className="m-icon-small add"
            onClick={() => {
              this.state.connectors_ids.push(item.id || this.state.input.toLocaleLowerCase());
              this.setState({ input: '' });
              this.props.onChange(this.state.connectors_ids);
            }}
          />
        </div>
      );
    }

    return (
      <div className="menu no-background">
        {text}
        {button}
      </div>
    );
  }
  render() {
    return (
      <div className="connectorsListManager">
        <div className="menu-title no-separator">
<<<<<<< HEAD
          <div className="text">
            {Languages.t('scenes.apps.tasks.connectors_menu', [], 'Connecteurs')}
          </div>
        </div>

        {this.state.connectors_ids.length == 0 && (
          <div className="menu-text">
            {Languages.t('scenes.apps.tasks.no_connector', [], 'Aucun connecteurs.')}
          </div>
=======
          <div className="text">{Languages.t('scenes.apps.tasks.connectors_menu', [], "Connecteurs")}</div>
        </div>

        {this.state.connectors_ids.length == 0 && (
          <div className="menu-text">{Languages.t('scenes.apps.tasks.no_connector', [], "Aucun connecteurs.")}</div>
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        )}
        {this.state.connectors_ids.map(id => {
          return this.renderLine(id, true);
        })}

        <div className="menu-title no-separator">
          <div className="text">Ajouter des connecteurs</div>
        </div>

        <div className="menu-buttons" style={{ paddingTop: 2, paddingBottom: 2 }}>
          <div className="text">
            <Input
              type="text"
              style={{ marginBottom: 8 }}
              className="small full_width bottom-margin"
<<<<<<< HEAD
              placeholder={Languages.t('components.listmanager.filter', [], 'Filtrer')}
=======
              placeholder={Languages.t('components.listmanager.filter', [], "Filtrer")}
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              style={{ margin: 0 }}
              onChange={evt => this.filter(evt.target.value)}
            />
          </div>
        </div>

        {this.state.filtered.slice(0, 5).map(item => {
          if (this.state.connectors_ids.indexOf(item.id) >= 0) {
            return '';
          }
          return this.renderLine(item, false);
        })}
      </div>
    );
  }
}
