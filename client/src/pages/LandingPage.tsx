import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ImagePlus, Sparkles, Palette, Library } from "lucide-react";
import LandingHeader from "@/components/LandingHeader";
import LandingFooter from "@/components/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
              <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
              <span className="text-sm text-purple-300">AI-Powered Card Generation</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Transform Your Ideas Into
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                Digital Art Cards
              </span>
            </h1>
            <p className="text-xl text-purple-200/80 mb-8 max-w-2xl">
              Generate stunning AI artwork and turn them into unique collectible trading cards.
              Your imagination is the only limit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/create">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Creating
                </Button>
              </Link>
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="border-purple-500/20 text-purple-200 hover:bg-purple-500/20">
                  <Library className="w-5 h-5 mr-2" />
                  View Gallery
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-1/2 left-0 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative" id="features">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-16">
            Create, Collect, Trade
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<ImagePlus className="w-8 h-8" />}
              title="AI-Powered Generation"
              description="Transform text descriptions into stunning visual artwork using state-of-the-art AI technology."
            />
            <FeatureCard
              icon={<Palette className="w-8 h-8" />}
              title="Unique Designs"
              description="Every generated image is one-of-a-kind, ensuring your collection stays truly special."
            />
            <FeatureCard
              icon={<Library className="w-8 h-8" />}
              title="Trading Card System"
              description="Convert your favorite generated images into collectible cards with unique attributes and stats."
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 relative" id="testimonials">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-16">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard
              quote="The AI image generation is incredible! I've created an amazing collection of trading cards."
              author="Sarah K."
              role="Digital Artist"
            />
            <TestimonialCard
              quote="The trading card system adds a whole new level of fun to AI art generation."
              author="Mike R."
              role="Card Collector"
            />
            <TestimonialCard
              quote="Easy to use and the results are always stunning. Highly recommended!"
              author="Alex M."
              role="Content Creator"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl transform -rotate-1"></div>
            <div className="relative bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg rounded-2xl p-8 md:p-12 transform rotate-1">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to Create Your First Card?
                </h2>
                <p className="text-lg text-purple-200/80 mb-8">
                  Join our community of creators and start building your unique collection today.
                </p>
                <Link href="/auth">
                  <Button size="lg" className="bg-white hover:bg-purple-50 text-purple-900">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Get Started Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg transform -rotate-1 group-hover:rotate-0 transition-all duration-300" />
      <div className="relative bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 transform rotate-1 group-hover:rotate-0 transition-all duration-300">
        <div className="text-purple-400 mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-purple-200/70">{description}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-lg transform -rotate-1 group-hover:rotate-0 transition-all duration-300" />
      <div className="relative bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 transform rotate-1 group-hover:rotate-0 transition-all duration-300">
        <div className="mb-4">
          <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 32 32">
            <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
          </svg>
        </div>
        <p className="text-purple-200/90 mb-4 italic">{quote}</p>
        <div>
          <p className="text-white font-semibold">{author}</p>
          <p className="text-purple-300/70 text-sm">{role}</p>
        </div>
      </div>
    </div>
  );
}