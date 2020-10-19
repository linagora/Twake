import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Search from 'services/search/search.js';
import InputIcon from 'components/Inputs/InputIcon.js';
import LoginService from 'services/login/login.js';

export default class MainView extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
    };

    Languages.addListener(this);
    Search.addListener(this);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Search.removeListener(this);
  }

  render() {
    if ((LoginService.server_infos || {}).elastic_search_available === false) {
      return '';
    }

    return (
      <InputIcon
        icon={'search'}
        value={Search.value}
        placeholder={Languages.t(
          'scenes.app.mainview.quick_search_placeholder',
          [],
          'Recherche rapide',
        )}
        small
        icon="search"
        onClick={() => Search.open()}
      />
    );
  }
}
