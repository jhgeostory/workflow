import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban } from 'lucide-react';
import { cn } from '../lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    const navItems = [
        { href: '/', label: '대시보드', icon: LayoutDashboard },
        { href: '/projects', label: '프로젝트 관리', icon: FolderKanban },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-10 hidden md:block">
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        PM System
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

            {/* Main Content */}
            <main className="flex-1 md:ml-64 min-h-screen">
                <header className="h-16 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200 px-6 flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-slate-800">
                        {navItems.find(i => i.href === location.pathname)?.label || 'PM System'}
                    </h1>
                    {/* Mobile Menu Button could go here */}
                </header>
                <div className="p-6 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
