import { NavLink, Outlet } from "react-router-dom";
import { Box, Settings, Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "模型管理", to: "/admin/models", icon: Box },
  { label: "供应商管理", to: "/admin/providers", icon: Users },
];

const AdminLayout = () => {
  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 border-r border-border bg-muted/30 flex flex-col">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Settings className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">后台管理</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <NavLink
            to="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-3 w-3 rotate-180" />
            返回前台
          </NavLink>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
