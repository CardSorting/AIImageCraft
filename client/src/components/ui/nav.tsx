import { Link, useLocation } from "wouter";
import { Button } from "./button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "./navigation-menu";
import { cn } from "@/lib/utils";

export function MainNav() {
  const [location] = useLocation();

  const links = [
    { href: "/gallery", label: "Gallery" },
    { href: "/cards", label: "Trading Cards" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/challenges", label: "Challenges" },
    { href: "/queue", label: "Play Game" },
  ];

  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        {links.map((link) => (
          <NavigationMenuItem key={link.href}>
            <Link href={link.href}>
              <NavigationMenuLink
                className={cn(
                  navigationMenuTriggerStyle(),
                  location === link.href &&
                    "bg-accent text-accent-foreground"
                )}
              >
                {link.label}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
