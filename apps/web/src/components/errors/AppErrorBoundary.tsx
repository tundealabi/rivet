import { Component, type ErrorInfo, type ReactNode } from "react";

import ServerErrorPage from "../../pages/ServerErrorPage";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorKey: number;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorKey: 0,
  };

  static getDerivedStateFromError(): Partial<AppErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled application error:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState((state) => ({
      hasError: false,
      errorKey: state.errorKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return <ServerErrorPage onRetry={this.handleRetry} />;
    }

    return <div key={this.state.errorKey}>{this.props.children}</div>;
  }
}
