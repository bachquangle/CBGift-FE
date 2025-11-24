export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading categories...</p>
      </div>
    </div>
  );
}
