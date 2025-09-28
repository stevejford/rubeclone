'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, Search, X } from 'lucide-react';
import { getIconComponent } from '@/lib/constants/categories';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MarketplaceFilters } from '@/types/marketplace';
import { CategoryMapping } from '@/lib/constants/categories';

interface CollapsibleFiltersProps {
  filters: MarketplaceFilters;
  onFiltersChange: (filters: Partial<MarketplaceFilters>) => void;
  categories: CategoryMapping[];
  totalApps?: number;
}

export function CollapsibleFilters({
  filters,
  onFiltersChange,
  categories,
  totalApps
}: CollapsibleFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false); // Default to collapsed for dropdown filters
  const [searchInput, setSearchInput] = useState(filters.query || '');
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Ensure categories is always an array
  const safeCategories = Array.isArray(categories) ? categories : [];
  
  // Show top 12 categories by default, rest on "Show More"
  const topCategories = safeCategories.slice(0, 12);
  const remainingCategories = safeCategories.slice(12);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    const newFilters: Partial<MarketplaceFilters> = {};
    if (trimmed.length > 0) {
      newFilters.query = trimmed;
    }
    onFiltersChange(newFilters);
  };

  const handleCategoryChange = (category: string) => {
    const newFilters: Partial<MarketplaceFilters> = {
      page: 1 // Reset to first page when changing category
    };
    if (category !== 'all') {
      newFilters.category = category;
    }
    onFiltersChange(newFilters);
  };

  const handleSortChange = (sort: string) => {
    const newFilters: Partial<MarketplaceFilters> = {
      page: 1 // Reset to first page when changing sort
    };
    if (sort && sort !== 'name') {
      newFilters.sort = sort as MarketplaceFilters['sort'];
    }
    onFiltersChange(newFilters);
  };

  const handlePricingChange = (pricing: string) => {
    const newFilters: Partial<MarketplaceFilters> = {
      page: 1
    };
    if (pricing !== 'all') {
      newFilters.pricing = pricing as MarketplaceFilters['pricing'];
    }
    onFiltersChange(newFilters);
  };

  const handleAuthFilterChange = (auth: string) => {
    onFiltersChange({ 
      requires_auth: auth === 'all' ? undefined : auth === 'auth_required',
      page: 1
    });
  };

  const clearFilters = () => {
    setSearchInput('');
    onFiltersChange({
      query: undefined,
      category: undefined,
      sort: 'name',
      pricing: undefined,
      requires_auth: undefined,
      page: 1
    });
  };

  const hasActiveFilters = !!(
    filters.query || 
    filters.category || 
    filters.pricing || 
    filters.requires_auth !== undefined
  );

  const activeFilterCount = [
    filters.query,
    filters.category,
    filters.pricing,
    filters.requires_auth !== undefined ? 'auth' : null
  ].filter(Boolean).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full flex flex-col">
      {/* Header - Always Visible */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {activeFilterCount}
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
            title={isExpanded ? "Collapse filters" : "Expand filters"}
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Collapsible Filter Options */}
        {isExpanded && (
          <div className="space-y-3 mb-3">
            {/* Sort By */}
            <div>
              <h3 className="text-xs font-medium text-gray-700 mb-2">Sort By</h3>
              <Select
                value={filters.sort || 'name'}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="tool_count">Tool Count</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pricing Filter */}
            <div>
              <h3 className="text-xs font-medium text-gray-700 mb-2">Pricing</h3>
              <Select
                value={filters.pricing || 'all'}
                onValueChange={handlePricingChange}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="All pricing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="freemium">Freemium</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Authentication Filter */}
            <div>
              <h3 className="text-xs font-medium text-gray-700 mb-2">Authentication</h3>
              <Select
                value={
                  filters.requires_auth === undefined ? 'all' :
                  filters.requires_auth ? 'auth_required' : 'no_auth'
                }
                onValueChange={handleAuthFilterChange}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="All apps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Apps</SelectItem>
                  <SelectItem value="no_auth">No Auth Required</SelectItem>
                  <SelectItem value="auth_required">Auth Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {totalApps && (
          <div className="text-xs text-gray-500 mb-3">
            {totalApps.toLocaleString()} apps available
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-600">Active filters:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 text-xs text-blue-600 hover:text-blue-800 p-1"
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Quick Search - Always Visible */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
          <Input
            type="text"
            placeholder="Search apps..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 pr-8 h-8 text-sm"
          />
          {searchInput && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => {
                setSearchInput('');
                onFiltersChange({ query: undefined });
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </form>

        {/* Active Filters Summary - Always Visible When Present */}
        {hasActiveFilters && (
          <div className="mt-2 space-y-1">
            {filters.query && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs w-full justify-between">
                <span className="truncate">Search: {filters.query}</span>
                <X
                  className="h-2.5 w-2.5 cursor-pointer flex-shrink-0"
                  onClick={() => {
                    setSearchInput('');
                    onFiltersChange({ query: undefined });
                  }}
                />
              </Badge>
            )}
            {filters.category && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs w-full justify-between">
                <span className="truncate">{filters.category}</span>
                <X
                  className="h-2.5 w-2.5 cursor-pointer flex-shrink-0"
                  onClick={() => onFiltersChange({ category: undefined })}
                />
              </Badge>
            )}
            {filters.pricing && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs w-full justify-between">
                <span className="truncate">Pricing: {filters.pricing}</span>
                <X
                  className="h-2.5 w-2.5 cursor-pointer flex-shrink-0"
                  onClick={() => onFiltersChange({ pricing: undefined })}
                />
              </Badge>
            )}
            {filters.requires_auth !== undefined && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs w-full justify-between">
                <span className="truncate">{filters.requires_auth ? 'Auth Required' : 'No Auth'}</span>
                <X
                  className="h-2.5 w-2.5 cursor-pointer flex-shrink-0"
                  onClick={() => onFiltersChange({ requires_auth: undefined })}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Categories - Always Visible */}
      <div className="flex-1 overflow-y-auto p-4">
        <div>
          <h3 className="text-xs font-medium text-gray-700 mb-2">Categories</h3>
          <div className="space-y-1">
            <Button
              variant={!filters.category ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start text-xs h-7"
              onClick={() => handleCategoryChange('all')}
            >
              All Apps
            </Button>
            {topCategories.map((category) => {
              const Icon = getIconComponent(category.iconName || 'Settings');
              return (
                <Button
                  key={category.partnerKey}
                  variant={filters.category === category.partnerKey ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start text-xs h-7"
                  onClick={() => handleCategoryChange(category.partnerKey)}
                >
                  <Icon className="w-3 h-3 mr-2 flex-shrink-0" />
                  <span className="truncate text-left">{category.displayName}</span>
                  <span className="ml-auto text-xs text-gray-400 flex-shrink-0">
                    {category.appCount}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* Show More Categories */}
          {remainingCategories.length > 0 && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="w-full text-xs text-blue-600 hover:text-blue-800 h-6"
              >
                {showAllCategories ? 'Show Less' : `Show ${remainingCategories.length} More`}
                {showAllCategories ? (
                  <ChevronUp className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </Button>

              {showAllCategories && (
                <div className="space-y-1 mt-2">
                  {remainingCategories.map((category) => {
                    const Icon = getIconComponent(category.iconName || 'Settings');
                    return (
                      <Button
                        key={category.partnerKey}
                        variant={filters.category === category.partnerKey ? 'default' : 'ghost'}
                        size="sm"
                        className="w-full justify-start text-xs h-7"
                        onClick={() => handleCategoryChange(category.partnerKey)}
                      >
                        <Icon className="w-3 h-3 mr-2 flex-shrink-0" />
                        <span className="truncate text-left">{category.displayName}</span>
                        <span className="ml-auto text-xs text-gray-400 flex-shrink-0">
                          {category.appCount}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
