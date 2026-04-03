export default function EventsLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-20 w-full bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  )
}
