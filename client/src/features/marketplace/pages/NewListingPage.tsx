import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Package, Loader2 } from "lucide-react";
import Header from "@/components/Header";

const listingSchema = z.object({
  type: z.enum(['PACK', 'SINGLE_CARD', 'BUNDLE']),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  basePrice: z.number().min(1, "Price must be at least 1 credit"),
  packId: z.number().optional(),
});

type ListingFormData = z.infer<typeof listingSchema>;

export function NewListingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      type: 'PACK',
      title: '',
      description: '',
      basePrice: 1,
    },
  });

  const { data: availablePacks, isLoading: isLoadingPacks } = useQuery({
    queryKey: ['/api/marketplace/new-listing/available-packs'],
  });

  const createListing = useMutation({
    mutationFn: async (data: ListingFormData) => {
      const response = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Listing Created",
        description: "Your listing has been created successfully.",
      });
      setLocation('/marketplace/listings');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ListingFormData) => {
    createListing.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select listing type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PACK">Card Pack</SelectItem>
                          <SelectItem value="SINGLE_CARD">Single Card</SelectItem>
                          <SelectItem value="BUNDLE">Bundle</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('type') === 'PACK' && (
                  <FormField
                    control={form.control}
                    name="packId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Pack</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a pack to list" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingPacks ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="w-4 h-4 animate-spin" />
                              </div>
                            ) : !availablePacks?.length ? (
                              <div className="flex flex-col items-center justify-center p-4 text-center">
                                <Package className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  No packs available to list
                                </p>
                              </div>
                            ) : (
                              availablePacks.map((pack: any) => (
                                <SelectItem key={pack.id} value={pack.id.toString()}>
                                  {pack.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (in credits)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createListing.isPending}
                >
                  {createListing.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Create Listing
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
