<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { books, isLoading, error, filteredBooks, setLoading, clearError } from '$lib/stores';
  import BookCard from '$lib/components/BookCard.svelte';
  import SearchFilters from '$lib/components/SearchFilters.svelte';
  
  let showGrid = true;
  
  onMount(async () => {
    await loadBooks();
  });
  
  async function loadBooks() {
    try {
      setLoading(true);
      clearError();
      const booksData = await api.getBooks({ limit: 100 });
      books.set(booksData);
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Failed to load books');
    } finally {
      setLoading(false);
    }
  }
  
  function toggleView() {
    showGrid = !showGrid;
  }
</script>

<svelte:head>
  <title>My Books - Matt's Book Organizer</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">My Library</h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">
        {#if $books.length > 0}
          {$filteredBooks.length} of {$books.length} books
        {:else}
          Loading your collection...
        {/if}
      </p>
    </div>
    
    <div class="mt-4 sm:mt-0 flex items-center space-x-2">
      <button
        on:click={toggleView}
        class="btn btn-secondary text-sm"
        title="Toggle view"
      >
        {showGrid ? '📋 List' : '📱 Grid'}
      </button>
      <button
        on:click={loadBooks}
        class="btn btn-secondary text-sm"
        disabled={$isLoading}
      >
        🔄 Refresh
      </button>
    </div>
  </div>
  
  <!-- Search and filters -->
  <SearchFilters />
  
  <!-- Error message -->
  {#if $error}
    <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
      <div class="flex">
        <span class="text-red-500 mr-2">⚠️</span>
        <div>
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
            Error loading books
          </h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">
            {$error}
          </p>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Loading state -->
  {#if $isLoading}
    <div class="flex justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading books...</p>
      </div>
    </div>
  
  <!-- Empty state -->
  {:else if $filteredBooks.length === 0 && $books.length === 0}
    <div class="text-center py-12">
      <span class="text-6xl mb-4 block">📚</span>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No books found
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Get started by adding your first book to the collection.
      </p>
      <a href="/add" class="btn btn-primary">
        Add Book
      </a>
    </div>
  
  <!-- No results state -->
  {:else if $filteredBooks.length === 0}
    <div class="text-center py-12">
      <span class="text-4xl mb-4 block">🔍</span>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No books match your filters
      </h3>
      <p class="text-gray-600 dark:text-gray-400">
        Try adjusting your search criteria or clearing the filters.
      </p>
    </div>
  
  <!-- Books grid/list -->
  {:else}
    <div class="
      {showGrid 
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
        : 'space-y-4'}
    ">
      {#each $filteredBooks as book (book.id)}
        <a 
          href="/book/{book.id}" 
          class="block hover:scale-[1.02] transition-transform duration-200"
        >
          <BookCard {book} />
        </a>
      {/each}
    </div>
    
    <!-- Load more button (for pagination) -->
    {#if $filteredBooks.length >= 50}
      <div class="text-center pt-8">
        <button class="btn btn-secondary">
          Load more books
        </button>
      </div>
    {/if}
  {/if}
</div>