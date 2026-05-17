import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
    };
  }

  public static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App render error', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
          <div className="w-full max-w-2xl rounded-[2rem] border border-rose-200 bg-white px-6 py-8 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Frontend error</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">La interfaz se interrumpio</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              La aplicacion detecto un error de render y detuvo la pantalla para evitar quedar en blanco.
            </p>
            <pre className="mt-5 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-white">
              {this.state.message || 'Sin detalle adicional.'}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
