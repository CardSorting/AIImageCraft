import { useQuery } from "@tanstack/react-query";
import { marketplaceService } from "../services/marketplaceService";
import { PackListingCard } from "../components/PackListingCard";
import { 
  Loader2, Package, ArrowLeft, Activity, 
  DollarSign, ShoppingCart, Clock, Plus, 
  BarChart3, ListFilter 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { PackListing } from "../types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

type ListingStatus = 'ACTIVE' | 'SOLD' | 'CANCELLED' | 'ALL';

export function UserListingsPage() {
  const [statusFilter, setStatusFilter] = useState<ListingStatus>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'price_high' | 'price_low'>('newest');
  const [selectedView, setSelectedView] = useState<"grid" | "analytics">("grid");

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

  // Prepare data for charts
  const statusChartData = [
    { name: 'Active', value: stats?.activeListings || 0 },
    { name: 'Sold', value: stats?.soldListings || 0 },
    { name: 'Cancelled', value: listings?.filter(l => l.status === 'CANCELLED').length || 0 },
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header with Navigation and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/marketplace">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/marketplace/new-listing">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Listing
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => setSelectedView(selectedView === "grid" ? "analytics" : "grid")}
          >
            {selectedView === "grid" ? (
              <BarChart3 className="w-4 h-4" />
            ) : (
              <ListFilter className="w-4 h-4" />
            )}
          </Button>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <CardContent className="p-0 flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Activity className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                  <p className="text-2xl font-bold">{stats?.activeListings}</p>
                  <p className="text-xs text-muted-foreground">
                    {((stats?.activeListings / stats?.totalListings) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardContent className="p-0 flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">{stats?.totalEarnings}</p>
                  <p className="text-xs text-green-500">
                    {stats?.soldListings} sales completed
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardContent className="p-0 flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <ShoppingCart className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sale Rate</p>
                  <p className="text-2xl font-bold">
                    {((stats?.soldListings / stats?.totalListings) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.soldListings} of {stats?.totalListings} listings
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardContent className="p-0 flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/10">
                  <Clock className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Price</p>
                  <p className="text-2xl font-bold">
                    {stats?.totalValue ? Math.round(stats.totalValue / stats.totalListings) : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    credits per listing
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedView === "analytics" ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Listing Status Distribution</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          ) : (
            <>
              {/* Tabs and Filters */}
              <Tabs defaultValue="all" className="w-full">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-lg border">
                  <div>
                    <TabsList>
                      <TabsTrigger value="all">All ({listings?.length || 0})</TabsTrigger>
                      <TabsTrigger value="active">Active ({stats?.activeListings || 0})</TabsTrigger>
                      <TabsTrigger value="sold">Sold ({stats?.soldListings || 0})</TabsTrigger>
                      <TabsTrigger value="cancelled">
                        Cancelled ({listings?.filter(l => l.status === 'CANCELLED').length || 0})
                      </TabsTrigger>
                    </TabsList>
                  </div>
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

                <TabsContent value="all" className="mt-6">
                  <div className="grid gap-6">
                    {sortedListings?.map((listing) => (
                      <PackListingCard 
                        key={listing.id} 
                        listing={listing} 
                        showActions={true}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="active" className="mt-6">
                  <div className="grid gap-6">
                    {sortedListings?.filter(l => l.status === 'ACTIVE').map((listing) => (
                      <PackListingCard 
                        key={listing.id} 
                        listing={listing} 
                        showActions={true}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="sold" className="mt-6">
                  <div className="grid gap-6">
                    {sortedListings?.filter(l => l.status === 'SOLD').map((listing) => (
                      <PackListingCard 
                        key={listing.id} 
                        listing={listing} 
                        showActions={true}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="cancelled" className="mt-6">
                  <div className="grid gap-6">
                    {sortedListings?.filter(l => l.status === 'CANCELLED').map((listing) => (
                      <PackListingCard 
                        key={listing.id} 
                        listing={listing} 
                        showActions={true}
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </>
      )}
    </div>
  );
}