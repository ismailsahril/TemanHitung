import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * ErrorBoundary class component to catch uncaught runtime errors in children tree.
 * Displays a fallback crash screen with reload button when an error occurs.
 */
export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const isDev = import.meta.env.DEV;
    if (isDev) {
      console.error('Uncaught error inside boundary:', error, errorInfo);
    }
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Ups, terjadi kesalahan</h1>
            <p className="text-slate-500 mb-8 text-sm">Aplikasi mengalami masalah yang tidak terduga.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3.5 bg-brand-600 text-white font-semibold rounded-2xl hover:bg-brand-700 transition active:scale-95 min-h-[48px] flex items-center justify-center"
              aria-label="Muat Ulang Aplikasi"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
