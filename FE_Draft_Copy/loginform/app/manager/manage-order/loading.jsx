export default function Loading() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white shadow-lg animate-pulse">
        <div className="p-6 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded"></div>
        </div>
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white p-4 rounded-lg animate-pulse">
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white rounded-lg animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
