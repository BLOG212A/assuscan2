import { useAuth } from "@/_core/hooks/useAuth";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { 
  FileSearch, 
  FileText, 
  MessageCircle, 
  BarChart3, 
  Settings, 
  Crown,
  LogOut,
  User,
  CreditCard,
  Menu
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { ReactNode, useState } from "react";
import { getLoginUrl } from "@/const";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, loading } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: authData } = trpc.auth.me.useQuery();
  const { data: profile } = trpc.profile.get.useQuery();

  const navItems = [
    { icon: <FileSearch className="w-5 h-5" />, label: "Scanner un contrat", href: "/dashboard" },
    { icon: <FileText className="w-5 h-5" />, label: "Mes contrats", href: "/dashboard/contracts" },
    { icon: <MessageCircle className="w-5 h-5" />, label: "Assistant ClaireAI", href: "/dashboard/chat" },
    { icon: <BarChart3 className="w-5 h-5" />, label: "Statistiques", href: "/dashboard/stats" },
    { icon: <Settings className="w-5 h-5" />, label: "Paramètres", href: "/dashboard/settings" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/dashboard";
    }
    return location.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-emerald-600">AssurScan</h1>
              <p className="text-sm text-muted-foreground">
                Connecte-toi pour continuer
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg hover:shadow-xl transition-all"
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-white"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-40 transition-transform ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="p-6">
          <Link href="/">
            <h1 className="text-2xl font-bold text-emerald-600 cursor-pointer">AssurScan</h1>
          </Link>
        </div>

        <nav className="px-4 space-y-2">
          {navItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <div
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                  isActive(item.href)
                    ? "bg-emerald-50 text-emerald-600 font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                {profile?.subscriptionPlan === "premium" ? "Premium" : "Gratuit"}
              </Badge>
              {profile?.subscriptionPlan !== "premium" && (
                <Crown className="w-4 h-4 text-yellow-500" />
              )}
            </div>
            <p className="text-xs text-slate-600 mb-3">
              {profile?.documentsUploaded || 0}/{profile?.documentsLimit || 3} contrats scannés
            </p>
            {profile?.subscriptionPlan !== "premium" && (
              <Button size="sm" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                <Crown className="w-4 h-4 mr-2" />
                Passer Premium
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="lg:block hidden">
              <h2 className="text-2xl font-bold text-slate-900">
                {navItems.find(item => isActive(item.href))?.label || "Dashboard"}
              </h2>
            </div>
            <div className="lg:hidden">
              {/* Spacer for mobile menu button */}
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="hidden sm:flex">
                {profile?.documentsUploaded || 0}/{profile?.documentsLimit || 3} contrats ce mois
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback className="bg-emerald-600 text-white">
                        {getInitials(user?.name || profile?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name || profile?.fullName || "Utilisateur"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email || profile?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard/settings">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Mon profil
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Mon abonnement
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
