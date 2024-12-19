import { FallbackProps } from 'react-error-boundary';

// NOTE: this component CANNOT USE HOOKS
export default function FallbackAppRender({ error, resetErrorBoundary }: FallbackProps) {
	// call resetErrorBoundary() to reset the error boundary and retry the render.
	return (
		<div role='alert' style={{ margin: 10 }}>
			<h2>Fatal Error While Rendering</h2>
			<h3>What went wrong</h3>
			<pre style={{ color: 'red', fontWeight: 'bold', whiteSpace: 'break-spaces', marginBottom: '1.5em', marginLeft: '1.5em' }}>{error.toString()}</pre>
			<button style={{ background: '#ff5f25', borderRadius: 5 }} onClick={resetErrorBoundary}>Refresh</button>
		</div>
	);
}
