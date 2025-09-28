import { useState } from 'react';
import { Search, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { getIconComponent } from '@/lib/constants/categories';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MarketplaceFilters } from '@/types/marketplace';
import { CategoryMapping } from '@/lib/constants/categories';

interface SearchAndFiltersProps {
  filters: MarketplaceFilters;
  onFiltersChange: (filters: Partial<MarketplaceFilters>) => void;
  categories: CategoryMapping[];
}

export function SearchAndFilters({ filters, onFiltersChange, categories }: SearchAndFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.query || '');
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Ensure categories is always an array
  const safeCategories = Array.isArray(categories) ? categories : [];

  // Show only first 6 categories by default, then show all when expanded
  const INITIAL_CATEGORIES_COUNT = 6;
  const displayedCategories = showAllCategories
    ? safeCategories
    : safeCategories.slice(0, INITIAL_CATEGORIES_COUNT);
  const hasMoreCategories = safeCategories.length > INITIAL_CATEGORIES_COUNT;

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

  return (
    <div className="flex flex-col space-y-4">
      {/* Search */}
      <div>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search apps..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 pr-10 text-sm"
          />
          {searchInput && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => {
                setSearchInput('');
                onFiltersChange({ query: undefined });
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>

      {/* Active Filters - Always show at top when present */}
      {hasActiveFilters && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-blue-800">Active Filters</span>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs text-blue-600 hover:text-blue-800">
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {filters.query && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-0.5 bg-white border-blue-300">
                {filters.query}
                <X 
                  className="h-2.5 w-2.5 cursor-pointer" 
                  onClick={() => {
                    setSearchInput('');
                    onFiltersChange({ query: undefined });
                  }} 
                />
              </Badge>
            )}
            {filters.category && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-0.5 bg-white border-blue-300">
                {filters.category}
                <X 
                  className="h-2.5 w-2.5 cursor-pointer" 
                  onClick={() => onFiltersChange({ category: undefined })} 
                />
              </Badge>
            )}
            {filters.pricing && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-0.5 bg-white border-blue-300">
                {filters.pricing}
                <X 
                  className="h-2.5 w-2.5 cursor-pointer" 
                  onClick={() => onFiltersChange({ pricing: undefined })} 
                />
              </Badge>
            )}
            {filters.requires_auth !== undefined && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-0.5 bg-white border-blue-300">
                {filters.requires_auth ? 'Auth Required' : 'No Auth'}
                <X 
                  className="h-2.5 w-2.5 cursor-pointer" 
                  onClick={() => onFiltersChange({ requires_auth: undefined })} 
                />
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Categories and Filters */}
      <div className="space-y-4">
        {/* Categories */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 flex-shrink-0">
            <Filter className="h-4 w-4" />
            Categories
          </h3>
          
          {/* Mobile: Horizontal scroll */}
          <div className="lg:hidden">
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={!filters.category ? 'default' : 'outline'}
                size="sm"
                className="whitespace-nowrap flex-shrink-0 text-xs px-3 py-1.5 h-7"
                onClick={() => handleCategoryChange('all')}
              >
                All
              </Button>
              {displayedCategories.map((category) => {
                const Icon = getIconComponent(category.iconName || 'Settings');
                return (
                  <Button
                    key={category.partnerKey}
                    variant={filters.category === category.partnerKey ? 'default' : 'outline'}
                    size="sm"
                    className="whitespace-nowrap flex-shrink-0 text-xs px-3 py-1.5 h-7"
                    onClick={() => handleCategoryChange(category.partnerKey)}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    <span>{category.displayName}</span>
                  </Button>
                );
              })}

              {/* Show More Button for Mobile */}
              {hasMoreCategories && (
                <Button
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap flex-shrink-0 text-xs px-3 py-1.5 h-7 text-gray-500"
                  onClick={() => setShowAllCategories(!showAllCategories)}
                >
                  {showAllCategories ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      +{safeCategories.length - INITIAL_CATEGORIES_COUNT}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {/* Desktop: Compact vertical list */}
          <div className="hidden lg:block space-y-0.5">
            <Button
              variant={!filters.category ? 'default' : 'ghost'}
              className="w-full justify-start text-xs py-1.5 h-8"
              onClick={() => handleCategoryChange('all')}
            >
              All Categories
            </Button>
            {displayedCategories.map((category) => {
              const Icon = getIconComponent(category.iconName || 'Settings');
              return (
                <Button
                  key={category.partnerKey}
                  variant={filters.category === category.partnerKey ? 'default' : 'ghost'}
                  className="w-full justify-start text-xs py-1.5 h-8"
                  onClick={() => handleCategoryChange(category.partnerKey)}
                >
                  <Icon className="w-3.5 h-3.5 mr-2" />
                  <span>{category.displayName}</span>
                </Button>
              );
            })}

            {/* Show More/Less Button */}
            {hasMoreCategories && (
              <Button
                variant="ghost"
                className="w-full justify-center text-xs py-1.5 h-8 text-gray-500 hover:text-gray-700 border-t border-gray-100 mt-2 pt-2"
                onClick={() => setShowAllCategories(!showAllCategories)}
              >
                {showAllCategories ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Show More ({safeCategories.length - INITIAL_CATEGORIES_COUNT})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <Separator className="my-3" />

        {/* Sort */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Sort By</h3>
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

        <Separator className="my-3" />

        {/* Pricing Filter */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Pricing</h3>
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

        <Separator className="my-3" />

        {/* Authentication Filter */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Authentication</h3>
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
    </div>
  );
}
