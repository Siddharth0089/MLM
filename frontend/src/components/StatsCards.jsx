import { TrophyIcon, UsersIcon } from "lucide-react";

function StatsCards({ activeSessionsCount, recentSessionsCount }) {
  return (
    <div className="lg:col-span-1 grid grid-cols-1 gap-6">
      {/* Active Count */}
      <div className="glass-panel rounded-2xl p-0 hover:scale-[1.02] transition-transform duration-300">
        <div className="card-body">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-primary/20 backdrop-blur-md rounded-2xl shadow-inner">
              <UsersIcon className="w-7 h-7 text-primary" />
            </div>
            <div className="badge badge-primary badge-lg shadow-lg shadow-primary/20">Live</div>
          </div>
          <div className="text-4xl font-black mb-1 text-base-content">{activeSessionsCount}</div>
          <div className="text-sm font-medium opacity-60">Active Sessions</div>
        </div>
      </div>

      {/* Recent Count */}
      <div className="glass-panel rounded-2xl p-0 hover:scale-[1.02] transition-transform duration-300">
        <div className="card-body">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-secondary/20 backdrop-blur-md rounded-2xl shadow-inner">
              <TrophyIcon className="w-7 h-7 text-secondary" />
            </div>
          </div>
          <div className="text-4xl font-black mb-1 text-base-content">{recentSessionsCount}</div>
          <div className="text-sm font-medium opacity-60">Total Sessions</div>
        </div>
      </div>
    </div>
  );
}

export default StatsCards;
