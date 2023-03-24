import React, { ErrorInfo } from 'react';
import RouterServices from 'app/features/router/services/router-service';

import 'app/styles/ui.less';

export default class ErrorBoundary extends React.Component<unknown, { hasError: boolean }> {
  static lastError: Record<string, Record<string, Error | string>> | null = null;

  constructor(props: unknown) {
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
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
