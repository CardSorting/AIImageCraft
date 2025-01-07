import { useLocation } from "wouter";
import { useAuth } from "@/features/auth/components/AuthProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";

export default function AuthPage() {
  const { signInWithGoogle, error, loading, clearError } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Google",
      });
      setLocation("/gallery");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Failed to sign in with Google",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md backdrop-blur-sm bg-black/30 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Welcome</CardTitle>
          <CardDescription className="text-purple-300/70">
            Sign in with your Google account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SiGoogle className="h-4 w-4" />
              )}
              Sign in with Google
            </Button>
            {error && (
              <p className="text-sm text-red-500 text-center">
                {error.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}