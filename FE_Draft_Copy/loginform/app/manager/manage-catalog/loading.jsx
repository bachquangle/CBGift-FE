export default function Loading() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white shadow-lg animate-pulse" />
      <div className="flex-1 flex flex-col">
        <div className="h-16 bg-white shadow-sm" />
        <div className="flex-1 p-6 space-y-4">
          <div className="h-32 bg-white rounded-lg animate-pulse" />
          <div className="h-96 bg-white rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
