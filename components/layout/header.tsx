"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUser, Menu, ScanLine, Clock, Settings, Edit3 } from "lucide-react"; // Added Edit3 for manual entry

import { ModeToggle } from "@/components/ui/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const routes = [
  {
    label: "Scanning",
    icon: ScanLine,
    href: "/scanning",
    active: (path: string) => path === "/scanning" || path === "/",
  },
  {
    label: "History",
    icon: Clock,
    href: "/history",
    active: (path: string) => path === "/history",
  },
  {
    label: "Manual Entry (Test)",
    icon: Edit3, // Using Edit3 icon, you can choose another
    href: "/manual-entry",
    active: (path: string) => path === "/manual-entry",
  },
];

export function Header() {
  const pathname = usePathname();
  const [openSheet, setOpenSheet] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Left: Sidebar Trigger */}
        <Sheet open={openSheet} onOpenChange={setOpenSheet}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mr-4 shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <nav className="flex flex-col gap-4 p-6 mt-6">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setOpenSheet(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    route.active(pathname) ? "bg-accent" : "transparent"
                  )}
                >
                  <route.icon className="h-5 w-5" />
                  {route.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Center: Title */}
        <div className="flex-1 flex justify-center items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-lg whitespace-nowrap">
              Roy Foss Automotive
            </span>
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}