/**
 * Submit Tool Page Loading Skeleton
 */
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl animate-pulse">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="h-10 w-64 bg-gray-200 rounded-lg mx-auto mb-4" />
        <div className="h-4 w-80 bg-gray-100 rounded mx-auto" />
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Tool Name */}
        <div>
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-10 w-full bg-gray-100 rounded-lg" />
        </div>

        {/* Website URL */}
        <div>
          <div className="h-4 w-28 bg-gray-200 rounded mb-2" />
          <div className="h-10 w-full bg-gray-100 rounded-lg" />
        </div>

        {/* Description */}
        <div>
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-32 w-full bg-gray-100 rounded-lg" />
        </div>

        {/* Category */}
        <div>
          <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
          <div className="h-10 w-full bg-gray-100 rounded-lg" />
        </div>

        {/* Pricing */}
        <div>
          <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="h-12 w-full bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
