import { useQuery } from "@tanstack/react-query";
import { marketplaceService } from "../services/marketplaceService";
import { PackListingCard } from "../components/PackListingCard";
import { Loader2, Package, ArrowLeft, Activity, DollarSign, ShoppingCart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { PackListing } from "../types";

type ListingStatus = 'ACTIVE' | 'SOLD' | 'CANCELLED' | 'ALL';

export function UserListingsPage() {
  const [statusFilter, setStatusFilter] = useState<ListingStatus>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'price_high' | 'price_low'>('newest');

  const { data: listings, isLoading } = useQuery({
    queryKey: ["/api/marketplace/listings/user"],
    queryFn: () => marketplaceService.getUserListings(),
  });

  const filteredListings = listings?.filter(listing => 
    statusFilter === 'ALL' ? true : listing.status === statusFilter
  );

  const sortedListings = filteredListings?.sort((a, b) => {
    switch (sortOrder) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'price_high':
        return b.price - a.price;
      case 'price_low':
        return a.price - b.price;
      default:
        return 0;
    }
  });

  const stats = listings?.reduce((acc, listing) => {
    acc.totalListings++;
    acc.totalValue += listing.price;
    if (listing.status === 'ACTIVE') acc.activeListings++;
    if (listing.status === 'SOLD') {
      acc.soldListings++;
      acc.totalEarnings += listing.price;
    }
    return acc;
  }, {
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    totalValue: 0,
    totalEarnings: 0,
  });

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/marketplace">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">My Listings Dashboard</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : !listings?.length ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">You haven't listed any packs yet</p>
          <Link href="/marketplace">
            <Button className="mt-4" variant="outline">
              Browse Marketplace
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Activity className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Listings</p>
                <p className="text-2xl font-bold">{stats?.activeListings}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">{stats?.totalEarnings}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <ShoppingCart className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sold Listings</p>
                <p className="text-2xl font-bold">{stats?.soldListings}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/10">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{stats?.totalValue}</p>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-lg border">
            <div className="flex-1">
              <h2 className="font-semibold mb-2">Listings ({filteredListings?.length || 0})</h2>
              <p className="text-sm text-muted-foreground">
                Manage your marketplace listings and track their status
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as ListingStatus)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Listings</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as typeof sortOrder)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="grid gap-6">
            {sortedListings?.map((listing) => (
              <PackListingCard 
                key={listing.id} 
                listing={listing} 
                showActions={true}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}