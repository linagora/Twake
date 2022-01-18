import React from 'react';
import RouterServices from 'app/services/RouterService';

import 'app/styles/ui.less';

export default class ErrorBoundary extends React.Component<{}, { hasError: boolean }> {
  static lastError: any = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: any, errorInfo: any) {
    ErrorBoundary.lastError = {
      error: {
        name: error,
        info: errorInfo.componentStack,
      },
    };
    RouterServices.replace(RouterServices.addRedirection(RouterServices.pathnames.ERROR));
  }

  render() {
    if (this.state.hasError) {
      return <div />;
    }
    return this.props.children;
  }
}
