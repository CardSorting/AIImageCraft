import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";

const formSchema = z.object({
  prompt: z.string().min(1, "Please enter a prompt"),
  tags: z.string().optional(),
});

interface PromptFormProps {
  onSubmit: (prompt: string, tags: string[]) => void;
}

export default function PromptForm({ onSubmit }: PromptFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      tags: "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const tags = values.tags
      ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      : [];
    onSubmit(values.prompt, tags);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Describe the image you want to create..."
                  className="bg-purple-950/30 border-purple-500/30 text-white placeholder:text-purple-300/50"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Add tags (comma-separated)..."
                  className="bg-purple-950/30 border-purple-500/30 text-white placeholder:text-purple-300/50"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate
        </Button>
      </form>
    </Form>
  );
}