import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface AppErrorBoundaryState {
  hasError: boolean;
}

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

export default class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  public state: AppErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error): void {
    console.error("[AppErrorBoundary] Uncaught error", error);
  }

  private readonly handleRetry = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-navy-950 px-6">
          <Text className="mb-2 text-center text-2xl font-bold text-azure-50">
            Something went wrong
          </Text>
          <Text className="mb-6 text-center text-azure-200">
            We hit an unexpected issue. Please try again.
          </Text>
          <TouchableOpacity
            className="rounded-xl border border-azure-400/40 bg-azure-500 px-5 py-3"
            onPress={this.handleRetry}
          >
            <Text className="font-semibold text-white">Reload Screen</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
