import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Outlet } from 'react-router-dom';

export const MainLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <TopBar onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-1 p-4 lg:p-8 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
