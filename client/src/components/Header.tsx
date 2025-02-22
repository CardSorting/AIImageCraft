import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { User, ImagePlus, Images, LogOut, Library, ShoppingCart, Zap } from "lucide-react";
import { CreditBalance } from "@/features/credits/components/CreditBalance";

export default function Header() {
  const { user, logout } = useUser();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-500/20 backdrop-blur-sm bg-black/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          PlayMore TCG
        </Link>

        <nav className="flex items-center gap-4">
          {user && (
            <>
              <CreditBalance className="mr-2" />
              <Link href="/credits">
                <Button variant="ghost" size="sm" className="text-purple-300/70 hover:text-purple-300">
                  <Zap className="h-4 w-4 mr-2" />
                  Buy Credits
                </Button>
              </Link>
            </>
          )}
          <Link href="/create">
            <Button variant="ghost" className="text-purple-300/70 hover:text-purple-300">
              <ImagePlus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </Link>
          <Link href="/gallery">
            <Button variant="ghost" className="text-purple-300/70 hover:text-purple-300">
              <Images className="h-4 w-4 mr-2" />
              Gallery
            </Button>
          </Link>
          <Link href="/cards">
            <Button variant="ghost" className="text-purple-300/70 hover:text-purple-300">
              <Library className="h-4 w-4 mr-2" />
              Trading Cards
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="ghost" className="text-purple-300/70 hover:text-purple-300">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Marketplace
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" className="text-purple-300/70 hover:text-purple-300">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="text-purple-300/70 hover:text-purple-300"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </nav>
      </div>
    </header>
  );
}