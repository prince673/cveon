export default function LoadingSpinner({ message = 'Fetching vulnerability data…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
      <div className="relative w-11 h-11">
        <div className="absolute inset-0 rounded-full border-2 border-dark-border" />
        <div className="absolute inset-0 rounded-full border-2 border-t-accent-cyan animate-spin-slow" />
      </div>
      <p className="text-sm animate-pulse">{message}</p>
    </div>
  )
}