"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { DemoModeBanner } from "./demo-mode-banner";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col">
      {/* Top Demo Banner */}
      <DemoModeBanner />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          isMobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-300">
          <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
