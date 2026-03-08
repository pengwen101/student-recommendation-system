import Navigation from './Navigation';
import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen bg-[#242424]"> 
            <Navigation/>
            <main className="ml-64 flex-1 min-h-screen">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}