export default function EventPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="h-10 w-3/4 bg-gray-200 rounded animate-pulse mx-auto" />
        <div className="h-6 w-1/2 bg-gray-100 rounded animate-pulse mx-auto" />
        <div className="h-48 w-full bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-12 w-full bg-red-100 rounded-xl animate-pulse" />
      </div>
    </div>
  )
}
