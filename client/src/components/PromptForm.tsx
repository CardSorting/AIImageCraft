import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Sparkles, Lightbulb, Coins } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  prompt: z.string().min(1, "Please enter a prompt"),
});

interface PromptFormProps {
  onSubmit: (prompt: string) => void;
  isSubmitting?: boolean;
}

const EXAMPLE_PROMPTS = [
  "A mystical trading card featuring a dragon in a cyberpunk city",
  "An epic battle scene between ancient warriors in a fantasy realm",
  "A majestic creature emerging from a portal of swirling energy",
  "A legendary artifact radiating magical power in a crystal cave"
];

export default function PromptForm({ onSubmit, isSubmitting }: PromptFormProps) {
  const [currentExample, setCurrentExample] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const rotateExample = () => {
    setCurrentExample((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(values.prompt))}
        className="space-y-6"
      >
        <div className="relative">
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative">
                      <Input
                        placeholder={`Try something like: "${EXAMPLE_PROMPTS[currentExample]}"`}
                        className="bg-purple-950/30 border-purple-500/30 text-white placeholder:text-purple-300/50 h-14 px-4 transition-all duration-200 focus:ring-2 focus:ring-purple-500/50"
                        {...field}
                      />
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-red-400 text-sm mt-2" />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={rotateExample}
            className="absolute right-3 top-3 text-purple-300/50 hover:text-purple-300 transition-colors"
          >
            <Lightbulb className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-purple-300/70">
            <Coins className="h-4 w-4" />
            <span>Costs 5 credits per generation</span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`
                flex-1 h-12 bg-gradient-to-r from-purple-600 to-blue-600 
                hover:from-purple-700 hover:to-blue-700
                disabled:from-purple-800 disabled:to-blue-800
                transition-all duration-300 transform hover:scale-[1.02]
                ${isSubmitting ? 'animate-pulse' : ''}
              `}
            >
              <Sparkles className={`mr-2 h-5 w-5 ${isSubmitting ? 'animate-spin' : ''}`} />
              {isSubmitting ? 'Generating...' : 'Generate Image'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}