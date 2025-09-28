export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Skeleton */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-muted rounded-lg animate-pulse"></div>
              <div className="w-32 h-6 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-4 bg-muted rounded animate-pulse"></div>
              <div className="w-24 h-4 bg-muted rounded animate-pulse"></div>
              <div className="w-16 h-8 bg-muted rounded animate-pulse"></div>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section Skeleton */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="w-96 h-12 bg-muted rounded mx-auto mb-6 animate-pulse"></div>
          <div className="w-full max-w-2xl h-6 bg-muted rounded mx-auto mb-2 animate-pulse"></div>
          <div className="w-3/4 max-w-xl h-6 bg-muted rounded mx-auto mb-8 animate-pulse"></div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="w-32 h-12 bg-muted rounded-lg animate-pulse"></div>
            <div className="w-40 h-12 bg-muted rounded-lg animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section Skeleton */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="w-80 h-8 bg-muted rounded mx-auto mb-12 animate-pulse"></div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="tool-card text-center">
                <div className="w-12 h-12 bg-muted rounded-lg mx-auto mb-4 animate-pulse"></div>
                <div className="w-48 h-6 bg-muted rounded mx-auto mb-2 animate-pulse"></div>
                <div className="w-full h-4 bg-muted rounded mb-2 animate-pulse"></div>
                <div className="w-3/4 h-4 bg-muted rounded mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Skeleton */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-muted rounded animate-pulse"></div>
              <div className="w-32 h-5 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="flex space-x-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-16 h-4 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
