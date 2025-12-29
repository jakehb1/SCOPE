'use client';

import { MarketCategory, MarketSortOption } from '@/types';

interface FilterSortControlsProps {
  category: MarketCategory;
  sortBy: MarketSortOption;
  onCategoryChange: (category: MarketCategory) => void;
  onSortChange: (sort: MarketSortOption) => void;
}

const categories: { value: MarketCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'politics', label: 'Politics' },
  { value: 'sports', label: 'Sports' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'finance', label: 'Finance' },
  { value: 'tech', label: 'Tech' },
  { value: 'culture', label: 'Culture' },
  { value: 'geopolitics', label: 'Geopolitics' },
  { value: 'other', label: 'Other' },
];

const sortOptions: { value: MarketSortOption; label: string }[] = [
  { value: 'volume', label: 'Volume' },
  { value: 'newest', label: 'Newest' },
  { value: 'ending_soon', label: 'Ending Soon' },
];

export default function FilterSortControls({
  category,
  sortBy,
  onCategoryChange,
  onSortChange,
}: FilterSortControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Category Filter */}
      <div className="flex-1">
        <label htmlFor="category" className="block text-sm font-medium text-white mb-2">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as MarketCategory)}
          className="w-full px-4 py-2 border-2 border-white rounded-lg focus:border-primary-black focus:outline-none bg-white text-primary-black"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort By */}
      <div className="flex-1">
        <label htmlFor="sort" className="block text-sm font-medium text-white mb-2">
          Sort By
        </label>
        <select
          id="sort"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as MarketSortOption)}
          className="w-full px-4 py-2 border-2 border-white rounded-lg focus:border-primary-black focus:outline-none bg-white text-primary-black"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value === 'ending_soon' ? 'Ending Soon' : option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

