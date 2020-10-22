import React from 'react';
import RouterServices from 'services/RouterServices';
import 'app/ui.scss';

export default class ErrorBoundary extends React.Component<{}, { hasError: boolean }> {
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
    RouterServices.history.push(RouterServices.pathnames.ERROR, {
      error: {
        name: error,
        info: errorInfo.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return <div />;
    }
    return this.props.children;
  }
}
