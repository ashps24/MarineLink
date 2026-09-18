import type { UserRole } from "@/types";
import type { Icon } from "@phosphor-icons/react";
import {
  SquaresFour,
  Buildings,
  UsersThree,
  Wrench,
  ClipboardText,
  UserCircle,
} from "@phosphor-icons/react/dist/ssr";

export interface NavItem {
  label: string;
  href: string;
  icon: Icon;
  roles: UserRole[];
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: SquaresFour,
    roles: ["internal", "dealer", "customer"],
  },
  {
    label: "Dealers",
    href: "/dealers",
    icon: Buildings,
    roles: ["internal"],
  },
  {
    label: "Customers",
    href: "/customers",
    icon: UsersThree,
    roles: ["internal"],
  },
  {
    label: "My Dealer Profile",
    href: "/dealers/me",
    icon: Buildings,
    roles: ["dealer"],
  },
  {
    label: "My Profile",
    href: "/customers/me",
    icon: UserCircle,
    roles: ["customer"],
  },
  {
    label: "Equipment",
    href: "/equipment",
    icon: Wrench,
    roles: ["internal", "dealer"],
  },
  {
    label: "My Equipment",
    href: "/equipment",
    icon: Wrench,
    roles: ["customer"],
  },
  {
    label: "Service",
    href: "/service",
    icon: ClipboardText,
    roles: ["internal", "dealer", "customer"],
  },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}
