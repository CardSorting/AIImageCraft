import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SiGithub } from "react-icons/si";

export default function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-purple-500/20 backdrop-blur-sm bg-black/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <a className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              AI Trading Cards
            </a>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-purple-200/80 hover:text-purple-200 transition-colors">
              Features
            </a>
            <a href="#testimonials" className="text-purple-200/80 hover:text-purple-200 transition-colors">
              Testimonials
            </a>
            <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="text-purple-200/80 hover:text-purple-200 transition-colors">
              <SiGithub className="w-5 h-5" />
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button variant="ghost" className="text-purple-200 hover:text-purple-100 hover:bg-purple-500/20">
                Log in
              </Button>
            </Link>
            <Link href="/auth">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
