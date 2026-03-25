interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export default function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div
        className={`${sizeClasses[size]} border-2 border-gray-200 border-t-primary-500 rounded-full animate-spin`}
      />
      {message && (
        <p className="text-sm text-gray-500 mt-3 animate-pulse">{message}</p>
      )}
    </div>
  );
}
