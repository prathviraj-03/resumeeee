"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Target,
  Sparkles,
  Mic,
  Brain,
  Settings,
  LogOut,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  Zap,
  ChevronDown,
  User,
  LayoutTemplate,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { logout } from "@/lib/api/auth";
import { cn, getInitials, getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
  // ─ Resume section hidden ─
  // {
  //   label: "Resumes",
  //   href: "/dashboard/resume",
  //   icon: FileText,
  // },
  {
    label: "ATS Score",
    href: "/dashboard/ats-score",
    icon: Target,
  },
  {
    label: "Tailored Resume",
    href: "/dashboard/optimize",
    icon: Sparkles,
  },
  {
    label: "Templates",
    href: "/dashboard/templates",
    icon: LayoutTemplate,
  },
  {
    label: "Mock Interview",
    href: "/dashboard/interview",
    icon: Mic,
  },
  {
    label: "Skill Gap",
    href: "/dashboard/skills",
    icon: Brain,
  },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout: logoutStore } = useAuthStore();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    logoutStore();
    router.push("/login");
    toast.success("Logged out successfully");
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-border">
        <div className="h-8 w-8 rounded-xl bg-primary-gradient flex items-center justify-center shadow-glow-sm">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-foreground tracking-tight">
          ResumeForge
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "nav-item",
                active && "active"
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-surface-border p-3 space-y-1">
        <Link
          href="/dashboard/settings"
          className="nav-item"
          onClick={onClose}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>

        <div className="flex items-center gap-3 px-3 py-2.5 mt-2">
          <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center text-xs font-semibold text-primary-400 shrink-0">
            {user ? getInitials(user.fullName) : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {getDisplayName(user)}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge
                variant={user?.role === "premium" ? "default" : "muted"}
                className="text-[10px] px-1.5 py-0"
              >
                {user?.role === "premium" ? "✦ Premium" : user?.role === "admin" ? "Admin" : "Free"}
              </Badge>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-muted-foreground hover:text-danger rounded-lg hover:bg-danger/10 transition-all"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ pageTitle }: { pageTitle: string }) {
  const { theme, setTheme } = useTheme();
  const { user, logout: logoutStore } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    logoutStore();
    router.push("/login");
  };

  return (
    <header className="topbar">
      <button
        onClick={toggleSidebar}
        className="mr-4 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-base font-semibold text-foreground flex-1">{pageTitle}</h1>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-secondary transition-colors">
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                {user ? getInitials(user.fullName) : "U"}
              </div>
              <span className="text-sm text-foreground/80 hidden sm:block">
                {getDisplayName(user).split(" ")[0]}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-foreground">{getDisplayName(user)}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    "/dashboard": "Dashboard",
    // "/dashboard/resume": "Resume Management",
    "/dashboard/ats-score": "ATS Scorer",
    "/dashboard/optimize": "Tailored Resume",
    "/dashboard/templates": "Resume Templates",
    "/dashboard/interview": "Mock Interview",
    "/dashboard/skills": "Skill Gap Analyzer",
    "/dashboard/profile": "User Profile",
    "/dashboard/settings": "Settings",
  };
  return map[pathname] || (pathname.includes("/dashboard/interview/") ? "Interview Session" : "Dashboard");
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = getPageTitle(pathname);

  const { user } = useAuthStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && user && !user.is_setup_done && pathname !== "/dashboard/profile/setup") {
      router.push("/dashboard/profile/setup");
    }
  }, [mounted, user, pathname, router]);

  if (!mounted) {
    return <div className="min-h-screen bg-surface" />;
  }

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
            >
              <Sidebar onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar pageTitle={pageTitle} />

        <main
          className="flex-1 overflow-y-auto p-6"
          id="main-content"
          role="main"
        >
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
