import { ListingAnalytics, PackListing } from "../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
  Eye,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

interface ListingAnalyticsDashboardProps {
  analytics: ListingAnalytics;
}

export function ListingAnalyticsDashboard({
  analytics,
}: ListingAnalyticsDashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{analytics.overview.totalViews}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Average Price</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.overview.averagePrice)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{formatPercentage(analytics.overview.viewsToSalesRatio)}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Avg. Time to Sell</p>
                <p className="text-2xl font-bold">{analytics.overview.averageTimeToSell}h</p>
              </div>
              <div className="p-3 rounded-full bg-orange-500/10">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>View & Sales Trends</CardTitle>
          <CardDescription>Track your listing performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.viewTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="views"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  name="Views"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="sales"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.1}
                  name="Sales"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Price Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Price Analysis</CardTitle>
          <CardDescription>Compare your prices with market averages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Average</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.priceAnalysis.yourAverage)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Market Average</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.priceAnalysis.marketAverage)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recommended Range</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(analytics.priceAnalysis.recommendedRange.min)} - {formatCurrency(analytics.priceAnalysis.recommendedRange.max)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rarity Distribution</CardTitle>
            <CardDescription>Performance by card rarity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categoryBreakdown.rarity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Element Distribution</CardTitle>
            <CardDescription>Performance by card element</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categoryBreakdown.element}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Price Optimization Opportunities</CardTitle>
          <CardDescription>Suggestions to improve your listing performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Current Price</TableHead>
                <TableHead>Suggested Price</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.performanceMetrics.priceOpportunities.map((opportunity) => (
                <TableRow key={opportunity.listingId}>
                  <TableCell>{formatCurrency(opportunity.currentPrice)}</TableCell>
                  <TableCell>{formatCurrency(opportunity.suggestedPrice)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {opportunity.suggestedPrice > opportunity.currentPrice ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      {formatPercentage(
                        Math.abs(
                          (opportunity.suggestedPrice - opportunity.currentPrice) /
                            opportunity.currentPrice
                        )
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{opportunity.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Listings Requiring Attention */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Listings Requiring Attention</CardTitle>
              <CardDescription>Items that may need updates or adjustments</CardDescription>
            </div>
            <UITooltip>
              <TooltipTrigger>
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </TooltipTrigger>
              <TooltipContent>
                These listings have lower than average performance metrics
              </TooltipContent>
            </UITooltip>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.performanceMetrics.needsAttention.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>{listing.pack.name}</TableCell>
                  <TableCell>{formatCurrency(listing.price)}</TableCell>
                  <TableCell>{listing.views}</TableCell>
                  <TableCell>{listing.status}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Optimize
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
