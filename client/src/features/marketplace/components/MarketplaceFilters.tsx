import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarketplaceFilters as FiltersType } from "../types";
import { FormEvent } from "react";

interface MarketplaceFiltersProps {
  filters: FiltersType;
  onFilterChange: (filters: FiltersType) => void;
}

export function MarketplaceFilters({ filters, onFilterChange }: MarketplaceFiltersProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newFilters: FiltersType = {
      minPrice: formData.get('minPrice') ? Number(formData.get('minPrice')) : undefined,
      maxPrice: formData.get('maxPrice') ? Number(formData.get('maxPrice')) : undefined,
      rarity: formData.get('rarity')?.toString() || undefined,
      element: formData.get('element')?.toString() || undefined,
      sortBy: formData.get('sortBy')?.toString() as FiltersType['sortBy'] || 'date_desc',
    };
    onFilterChange(newFilters);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-card rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Min Price</label>
          <Input
            type="number"
            name="minPrice"
            placeholder="Min Price"
            defaultValue={filters.minPrice}
            min={0}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Max Price</label>
          <Input
            type="number"
            name="maxPrice"
            placeholder="Max Price"
            defaultValue={filters.maxPrice}
            min={0}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Rarity</label>
          <Select name="rarity" defaultValue={filters.rarity || "all"}>
            <SelectTrigger>
              <SelectValue placeholder="Select Rarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Rarity</SelectItem>
              <SelectItem value="COMMON">Common</SelectItem>
              <SelectItem value="RARE">Rare</SelectItem>
              <SelectItem value="EPIC">Epic</SelectItem>
              <SelectItem value="LEGENDARY">Legendary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Element</label>
          <Select name="element" defaultValue={filters.element || "all"}>
            <SelectTrigger>
              <SelectValue placeholder="Select Element" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Element</SelectItem>
              <SelectItem value="FIRE">Fire</SelectItem>
              <SelectItem value="WATER">Water</SelectItem>
              <SelectItem value="EARTH">Earth</SelectItem>
              <SelectItem value="AIR">Air</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Sort By</label>
        <Select name="sortBy" defaultValue={filters.sortBy || "date_desc"}>
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price_asc">Price (Low to High)</SelectItem>
            <SelectItem value="price_desc">Price (High to Low)</SelectItem>
            <SelectItem value="date_desc">Newest First</SelectItem>
            <SelectItem value="date_asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">Apply Filters</Button>
    </form>
  );
}