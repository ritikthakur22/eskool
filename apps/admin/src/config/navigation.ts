import {
  User,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  School,
  ScrollText,
  Settings,
  ShieldUser,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "./routes";

export type NavItem = { label: string; href: string; icon: LucideIcon };
export type NavSection = { title: string; items: NavItem[] };

export const navigation: NavSection[] = [
  {
    title: "Menu",
    items: [
      { label: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
      { label: "Students", href: ROUTES.students, icon: User },
      { label: "Teachers", href: ROUTES.teachers, icon: Users },
      { label: "Admins", href: ROUTES.admins, icon: ShieldUser },
      { label: "Classes", href: ROUTES.classes, icon: School },
      { label: "Notices", href: ROUTES.notices, icon: Megaphone },
      { label: "Audit Logs", href: ROUTES.auditLogs, icon: ScrollText },
    ],
  },
  {
    title: "Help",
    items: [
      { label: "Settings", href: ROUTES.settings, icon: Settings },
      { label: "Support", href: ROUTES.support, icon: LifeBuoy },
    ],
  },
];