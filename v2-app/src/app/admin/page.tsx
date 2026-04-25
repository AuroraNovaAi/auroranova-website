'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/app/actions/dashboard';

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => getDashboardStats(),
  });

  // Dummy chart data (last 14 days)
  const chartData = [12, 19, 15, 25, 22, 30, 28, 35, 45, 40, 50, 65, 55, 75];
  const maxVal = Math.max(...chartData);

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 mb-1.5">Dashboard</h1>
      <p className="text-sm text-zinc-400 mb-7">Genel bakış ve istatistikler</p>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <KpiCard 
          label="Toplam Üye" 
          value={isLoading ? '...' : stats?.totalMembers?.toString() || '0'} 
          colorClass="text-[#97B3E8]" 
        />
        <KpiCard 
          label="Bu Hafta Yeni" 
          value={isLoading ? '...' : stats?.newThisWeek?.toString() || '0'} 
          colorClass="text-[#55efc4]" 
        />
        <KpiCard 
          label="Bugün Görüntüleme" 
          value={isLoading ? '...' : stats?.todayViews?.toString() || '0'} 
          colorClass="text-[#C19E6A]" 
        />
        <KpiCard 
          label="Okunmamış Başvuru" 
          value={isLoading ? '...' : stats?.unreadSubmissions?.toString() || '0'} 
          colorClass="text-zinc-50" 
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6 shadow-xl backdrop-blur-sm">
        <div className="text-xs font-semibold text-white/45 uppercase tracking-widest mb-4">
          Son 14 Gün — Sayfa Görüntülemesi
        </div>
        
        {error && (
          <div className="flex items-center justify-center h-[100px] text-red-400 text-sm">
            Veriler yüklenirken bir hata oluştu.
          </div>
        )}
        
        {!error && (
          <div className="flex items-end justify-between h-[100px] gap-2">
            {chartData.map((val, i) => (
              <div key={i} className="group relative flex-1 flex flex-col justify-end items-center h-full">
                {/* Tooltip */}
                <div className="absolute -top-8 bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {val} Görüntüleme
                </div>
                {/* Bar */}
                <div 
                  className="w-full bg-[#6c5ce7]/40 hover:bg-[#6c5ce7] rounded-t-sm transition-all duration-300 ease-out"
                  style={{ height: `${(val / maxVal) * 100}%` }}
                ></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, colorClass }: { label: string, value: string, colorClass: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 shadow-lg backdrop-blur-sm hover:bg-white/10 transition-colors">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-white/35 mb-2">
        {label}
      </div>
      <div className={`text-[26px] font-bold leading-none ${colorClass}`}>
        {value}
      </div>
    </div>
  );
}
