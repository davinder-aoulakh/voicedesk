import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { base44 } from '@/api/base44Client';
import { Menu, X } from 'lucide-react';

export default function AppLayout() {
  const [business, setBusiness] = useState(null);
  const [primaryLocation, setPrimaryLocation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const loadBusiness = async () => {
      const user = await base44.auth.me();
      const businesses = await base44.entities.Business.filter({ owner_id: user.id });
      if (!businesses.length) return;
      const biz = businesses[0];
      setBusiness(biz);
      const locations = await base44.entities.Location.filter({ business_id: biz.id, is_primary: true });
      setPrimaryLocation(locations[0] || null);
    };
    loadBusiness();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop always visible, mobile drawer */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-30 lg:z-auto h-full
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar business={business} primaryLocation={primaryLocation} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-secondary">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-syne font-semibold text-foreground">VoiceDesk</span>
        </div>

        <TopBar business={business} primaryLocation={primaryLocation} />

        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ business, setBusiness }} />
        </main>
      </div>
    </div>
  );
}