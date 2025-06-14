<script>
  import { filters, updateFilters } from '$lib/stores';
  
  let searchQuery = '';
  let selectedShelf = '';
  let selectedRating = undefined;
  
  // Debounce search input
  let searchTimeout;
  
  function handleSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      updateFilters({ search: searchQuery, skip: 0 });
    }, 300);
  }
  
  function handleShelfChange() {
    updateFilters({ shelf: selectedShelf, skip: 0 });
  }
  
  function handleRatingChange() {
    updateFilters({ rating: selectedRating, skip: 0 });
  }
  
  function clearFilters() {
    searchQuery = '';
    selectedShelf = '';
    selectedRating = undefined;
    updateFilters({ search: '', shelf: '', rating: undefined, skip: 0 });
  }
  
  // Predefined shelf options
  const commonShelves = [
    'read',
    'currently-reading', 
    'to-read',
    'favorites',
    'library'
  ];
  
  const ratingOptions = [1, 2, 3, 4, 5];
</script>

<div class="card p-4 mb-6">
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <!-- Search -->
    <div class="md:col-span-2">
      <label for="search" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Search books
      </label>
      <input
        id="search"
        type="text"
        bind:value={searchQuery}
        on:input={handleSearchInput}
        placeholder="Search by title, author, or publisher..."
        class="input"
      />
    </div>
    
    <!-- Shelf filter -->
    <div>
      <label for="shelf" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Shelf
      </label>
      <select
        id="shelf"
        bind:value={selectedShelf}
        on:change={handleShelfChange}
        class="input"
      >
        <option value="">All shelves</option>
        {#each commonShelves as shelf}
          <option value={shelf}>{shelf.replace('-', ' ')}</option>
        {/each}
      </select>
    </div>
    
    <!-- Rating filter -->
    <div>
      <label for="rating" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Rating
      </label>
      <select
        id="rating"
        bind:value={selectedRating}
        on:change={handleRatingChange}
        class="input"
      >
        <option value={undefined}>All ratings</option>
        {#each ratingOptions as rating}
          <option value={rating}>{rating} star{rating !== 1 ? 's' : ''}</option>
        {/each}
      </select>
    </div>
  </div>
  
  <!-- Active filters and clear button -->
  <div class="mt-4 flex items-center justify-between">
    <div class="flex flex-wrap gap-2">
      {#if $filters.search}
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-100">
          Search: "{$filters.search}"
        </span>
      {/if}
      {#if $filters.shelf}
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
          Shelf: {$filters.shelf.replace('-', ' ')}
        </span>
      {/if}
      {#if $filters.rating}
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
          Rating: {$filters.rating} star{$filters.rating !== 1 ? 's' : ''}
        </span>
      {/if}
    </div>
    
    {#if $filters.search || $filters.shelf || $filters.rating}
      <button
        on:click={clearFilters}
        class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      >
        Clear filters
      </button>
    {/if}
  </div>
</div>