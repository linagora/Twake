import React from 'react';
import RouterServices from '../../services/RouterServices';
import 'app/ui.scss';

type State = {
  hasError: boolean;
  error: any;
};

export default class ErrorBoundary extends React.Component<{}, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: {},
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
