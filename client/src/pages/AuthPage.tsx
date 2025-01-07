import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof formSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, error, isLoading } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (isLogin) {
        await login(data);
      } else {
        await register(data);
      }
      setLocation("/gallery");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: err.message || "Failed to authenticate",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md backdrop-blur-sm bg-black/30 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-2xl text-white">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-purple-300/70">
            {isLogin
              ? "Sign in to your account"
              : "Sign up for a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-300">Username</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-black/50 border-purple-500/30 text-white"
                        placeholder="Enter your username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-300">Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        className="bg-black/50 border-purple-500/30 text-white"
                        placeholder="Enter your password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-300/70 hover:text-purple-300 text-sm"
            >
              {isLogin
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
          {error && (
            <p className="mt-4 text-sm text-red-500 text-center">
              {error.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}