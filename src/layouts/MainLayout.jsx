import RoleSwitcher from '../components/RoleSwitcher';
import { Shield, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function MainLayout({ children }) {
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-brand text-white shadow-md z-20 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Shield className="h-7 w-7 text-brand-light" />
              <h1 className="text-lg font-bold tracking-tight hidden sm:block">Design Flow Control</h1>
            </Link>
            
            {!isDashboard && (
              <>
                <div className="w-px h-6 bg-brand-light/30 hidden sm:block"></div>
                <Link 
                  to="/" 
                  className="hidden sm:flex items-center space-x-1 text-sm text-brand-light hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-md"
                >
                  <Home className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <RoleSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 min-h-[600px]">
          {children}
        </div>
      </main>
    </div>
  );
}
