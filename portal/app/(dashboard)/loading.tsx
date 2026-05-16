export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 w-full animate-pulse">
      <div className="mb-8 border-b border-zinc-800 pb-6 flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-zinc-800/80 rounded-md mb-3"></div>
          <div className="h-4 w-72 bg-zinc-900 rounded-md"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-32 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl w-full"></div>
          <div className="h-32 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl w-full"></div>
          <div className="h-32 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl w-full"></div>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <div className="h-64 bg-zinc-900/30 border border-zinc-800/30 rounded-2xl w-full"></div>
          <div className="h-64 bg-zinc-900/30 border border-zinc-800/30 rounded-2xl w-full"></div>
        </div>
      </div>
    </div>
  );
}
