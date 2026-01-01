import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Menu, X, Calendar, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNotifications } from '../hooks/useNotifications';

export function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const notifications = useNotifications();
    const [showNotif, setShowNotif] = useState(false);

    const navItems = [
        { href: '/', label: '대시보드', icon: LayoutDashboard },
        { href: '/projects', label: '프로젝트 관리', icon: FolderKanban },
        { href: '/schedule', label: '스케줄', icon: Calendar },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-10 hidden md:block">
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        JH-PM story
                    </span>
                </div>
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <Icon size={20} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Mobile Sidebar (Overlay) */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
                    <aside className="absolute inset-y-0 left-0 w-64 bg-white border-r border-slate-200 animate-in slide-in-from-left duration-200">
                        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                JH-PM story
                            </span>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 hover:text-slate-700">
                                <X size={24} />
                            </button>
                        </div>
                        <nav className="p-4 space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-blue-50 text-blue-700"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        <Icon size={20} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 md:ml-64 min-h-screen">
                <header className="h-16 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden text-slate-500 hover:text-slate-700"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-lg font-semibold text-slate-800">
                            {navItems.find(i => i.href === location.pathname)?.label || 'JH-PM story'}
                        </h1>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowNotif(!showNotif)}
                            className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <Bell size={20} />
                            {notifications.length > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                            )}
                        </button>

                        {showNotif && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowNotif(false)} />
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-40 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                        <h3 className="font-bold text-sm text-slate-800">알림 ({notifications.length})</h3>
                                        {notifications.length > 0 && (
                                            <span className="text-[10px] text-slate-500">최근 알림순</span>
                                        )}
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 text-sm">
                                                새로운 알림이 없습니다.
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-50">
                                                {notifications.map(notif => (
                                                    <Link
                                                        key={notif.id}
                                                        to={notif.link || '#'}
                                                        className="block p-3 hover:bg-slate-50 transition-colors"
                                                        onClick={() => setShowNotif(false)}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${notif.type === 'deadline' ? 'bg-red-50 text-red-600 border-red-100' :
                                                                    notif.type === 'overdue' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                                        notif.type === 'issue' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                            'bg-slate-50 text-slate-600 border-slate-200'
                                                                }`}>
                                                                {notif.type === 'deadline' ? '종료임박' :
                                                                    notif.type === 'issue' ? '이슈' :
                                                                        notif.type === 'overdue' ? '지연' : '알림'}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">{notif.projectName}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-700 leading-snug">{notif.message}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1 text-right">{notif.date}</p>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </header>
                <div className="p-6 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
