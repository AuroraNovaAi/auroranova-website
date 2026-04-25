import AdminTopbar from '@/components/admin/AdminTopbar';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      <AdminTopbar />
      <div className="flex flex-1 min-h-0">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
