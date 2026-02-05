import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 bg-base-100 text-error h-screen overflow-auto">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
                    <div className="bg-base-200 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                        <h2 className="font-bold text-lg mb-2">Error:</h2>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        <h2 className="font-bold text-lg mt-4 mb-2">Component Stack:</h2>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </div>
                    <button
                        className="btn btn-primary mt-6"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
