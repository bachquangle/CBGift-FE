export default function Loading() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-indigo-50 shadow-md animate-pulse"></div>
      <div className="flex-1 flex flex-col">
        <div className="h-16 bg-white shadow-sm animate-pulse"></div>
        <div className="flex-1 p-6 space-y-6">
          <div className="bg-white p-6 rounded-lg h-20 animate-pulse"></div>
          <div className="bg-white rounded-lg h-96 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
