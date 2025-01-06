import { useQuery, useQueryClient } from "@tanstack/react-query";
import { marketplaceService } from "../services/marketplaceService";
import { PackListingCard } from "../components/PackListingCard";
import {
  Loader2, Package, ArrowLeft, Activity,
  DollarSign, ShoppingCart, Clock, Plus,
  BarChart3, ListFilter, Trash2, PenLine,
  CheckSquare, Square, ChevronDown, Trophy
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SellerPerformanceDashboard } from "../components/SellerPerformanceDashboard";

type ListingStatus = 'ACTIVE' | 'SOLD' | 'CANCELLED' | 'ALL';

export function UserListingsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ListingStatus>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'price_high' | 'price_low'>('newest');
  const [selectedView, setSelectedView] = useState<"grid" | "analytics">("grid");
  const [selectedListings, setSelectedListings] = useState<Set<number>>(new Set());
  const [showBulkPriceDialog, setShowBulkPriceDialog] = useState(false);
  const [bulkPrice, setBulkPrice] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"listings" | "performance">("listings");
  const { toast } = useToast();

  const { data: listings, isLoading: isListingsLoading } = useQuery({
    queryKey: ["/api/marketplace/listings/user"],
    queryFn: () => marketplaceService.getUserListings(),
  });

  const { data: performance, isLoading: isPerformanceLoading } = useQuery({
    queryKey: ["/api/marketplace/seller/performance"],
    queryFn: () => marketplaceService.getSellerPerformance(),
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

  const statusChartData = [
    { name: 'Active', value: stats?.activeListings || 0 },
    { name: 'Sold', value: stats?.soldListings || 0 },
    { name: 'Cancelled', value: listings?.filter(l => l.status === 'CANCELLED').length || 0 },
  ];

  const toggleSelectListing = (listingId: number) => {
    const newSelected = new Set(selectedListings);
    if (newSelected.has(listingId)) {
      newSelected.delete(listingId);
    } else {
      newSelected.add(listingId);
    }
    setSelectedListings(newSelected);
  };

  const selectAllListings = () => {
    if (sortedListings) {
      const allIds = sortedListings.map(l => l.id);
      setSelectedListings(new Set(allIds));
    }
  };

  const clearSelection = () => {
    setSelectedListings(new Set());
  };

  const handleBulkCancel = async () => {
    try {
      await Promise.all(
        Array.from(selectedListings).map(listingId =>
          marketplaceService.cancelListing(listingId)
        )
      );

      toast({
        title: "Success",
        description: `Successfully cancelled ${selectedListings.size} listings`,
      });

      clearSelection();

      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/listings/user"] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel listings",
        variant: "destructive",
      });
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (!bulkPrice || isNaN(Number(bulkPrice))) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Bulk price update",
      description: `Updating prices for ${selectedListings.size} listings to ${bulkPrice} credits...`,
    });
    setShowBulkPriceDialog(false);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
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
          {activeTab === "listings" && (
            <>
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
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 border-b">
        <Button
          variant={activeTab === "listings" ? "default" : "ghost"}
          className="relative px-4 py-2 -mb-px"
          onClick={() => setActiveTab("listings")}
        >
          <Package className="w-4 h-4 mr-2" />
          Listings
        </Button>
        <Button
          variant={activeTab === "performance" ? "default" : "ghost"}
          className="relative px-4 py-2 -mb-px"
          onClick={() => setActiveTab("performance")}
        >
          <Trophy className="w-4 h-4 mr-2" />
          Performance
        </Button>
      </div>

      {activeTab === "listings" ? (
        <>
          {selectedListings.size > 0 && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg border">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={clearSelection}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Clear Selection ({selectedListings.size})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={selectAllListings}
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Select All
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkPriceDialog(true)}
                >
                  <PenLine className="w-4 h-4 mr-2" />
                  Update Prices
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkCancel}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancel Selected
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      More Actions
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      Download as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Print Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {isListingsLoading ? (
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
                  <Tabs defaultValue="active" className="w-full">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-lg border">
                      <div>
                        <TabsList>
                          <TabsTrigger value="active">Active ({stats?.activeListings || 0})</TabsTrigger>
                          <TabsTrigger value="sold">Sold ({stats?.soldListings || 0})</TabsTrigger>
                          <TabsTrigger value="cancelled">
                            Cancelled ({listings?.filter(l => l.status === 'CANCELLED').length || 0})
                          </TabsTrigger>
                          <TabsTrigger value="all">All ({listings?.length || 0})</TabsTrigger>
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

                    <TabsContent value="active" className="mt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {sortedListings?.filter(l => l.status === 'ACTIVE').map((listing) => (
                          <PackListingCard
                            key={listing.id}
                            listing={listing}
                            showActions={true}
                            isSelected={selectedListings.has(listing.id)}
                            onSelect={() => toggleSelectListing(listing.id)}
                            showCheckbox={true}
                            layout="grid"
                          />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="sold" className="mt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {sortedListings?.filter(l => l.status === 'SOLD').map((listing) => (
                          <PackListingCard
                            key={listing.id}
                            listing={listing}
                            showActions={true}
                            isSelected={selectedListings.has(listing.id)}
                            onSelect={() => toggleSelectListing(listing.id)}
                            showCheckbox={true}
                            layout="grid"
                          />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="cancelled" className="mt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {sortedListings?.filter(l => l.status === 'CANCELLED').map((listing) => (
                          <PackListingCard
                            key={listing.id}
                            listing={listing}
                            showActions={true}
                            isSelected={selectedListings.has(listing.id)}
                            onSelect={() => toggleSelectListing(listing.id)}
                            showCheckbox={true}
                            layout="grid"
                          />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="all" className="mt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {sortedListings?.map((listing) => (
                          <PackListingCard
                            key={listing.id}
                            listing={listing}
                            showActions={true}
                            isSelected={selectedListings.has(listing.id)}
                            onSelect={() => toggleSelectListing(listing.id)}
                            showCheckbox={true}
                            layout="grid"
                          />
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </>
          )}
        </>
      ) : (
        <>
          {isPerformanceLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : performance ? (
            <SellerPerformanceDashboard performance={performance} />
          ) : (
            <div className="text-center p-8 bg-muted rounded-lg">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                Unable to load performance data
              </p>
            </div>
          )}
        </>
      )}

      <Dialog open={showBulkPriceDialog} onOpenChange={setShowBulkPriceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Prices</DialogTitle>
            <DialogDescription>
              Set a new price for {selectedListings.size} selected listings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                type="number"
                placeholder="Enter new price"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkPriceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkPriceUpdate}>
              Update Prices
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}