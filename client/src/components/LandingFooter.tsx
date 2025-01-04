import { Link } from "wouter";

export default function LandingFooter() {
  return (
    <footer className="border-t border-purple-500/20 bg-black/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">AI Trading Cards</h3>
            <p className="text-purple-200/70 text-sm">
              Transform your ideas into unique digital collectibles using the power of AI.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/gallery">
                  <a className="text-purple-200/70 hover:text-purple-200">Gallery</a>
                </Link>
              </li>
              <li>
                <Link href="/create">
                  <a className="text-purple-200/70 hover:text-purple-200">Create Card</a>
                </Link>
              </li>
              <li>
                <a href="#features" className="text-purple-200/70 hover:text-purple-200">
                  Features
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-purple-200/70 hover:text-purple-200">Documentation</a>
              </li>
              <li>
                <a href="#" className="text-purple-200/70 hover:text-purple-200">API Reference</a>
              </li>
              <li>
                <a href="#" className="text-purple-200/70 hover:text-purple-200">Status</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-purple-200/70 hover:text-purple-200">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="text-purple-200/70 hover:text-purple-200">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="text-purple-200/70 hover:text-purple-200">Cookie Policy</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-purple-500/20">
          <p className="text-center text-purple-200/50 text-sm">
            © {new Date().getFullYear()} AI Trading Cards. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
