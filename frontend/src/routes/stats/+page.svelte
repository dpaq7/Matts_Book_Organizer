<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import type { ReadingStats } from '$lib/api';
  import { stats, books, isLoading, error, setLoading, clearError } from '$lib/stores';
  
  let readingStats: ReadingStats | null = null;
  let topAuthors: { author: string; count: number }[] = [];
  let yearlyReading: { year: number; count: number }[] = [];
  let ratingDistribution: { rating: number; count: number }[] = [];
  
  onMount(async () => {
    await loadStats();
    await loadBooks();
  });
  
  async function loadStats() {
    try {
      setLoading(true);
      clearError();
      readingStats = await api.getStats();
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }
  
  async function loadBooks() {
    try {
      const booksData = await api.getBooks({ limit: 500 });
      books.set(booksData);
      calculateStatistics(booksData);
    } catch (err) {
      console.error('Failed to load books for statistics:', err);
    }
  }
  
  function calculateStatistics(booksData: any[]) {
    // Top authors
    const authorCounts: Record<string, number> = {};
    booksData.forEach(book => {
      authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
    });
    topAuthors = Object.entries(authorCounts)
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Yearly reading
    const yearlyCounts: Record<number, number> = {};
    booksData
      .filter(book => book.date_read)
      .forEach(book => {
        const year = new Date(book.date_read).getFullYear();
        yearlyCounts[year] = (yearlyCounts[year] || 0) + 1;
      });
    yearlyReading = Object.entries(yearlyCounts)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year);
    
    // Rating distribution
    const ratingCounts: Record<number, number> = {};
    booksData
      .filter(book => book.rating)
      .forEach(book => {
        ratingCounts[book.rating] = (ratingCounts[book.rating] || 0) + 1;
      });
    ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: ratingCounts[rating] || 0
    }));
  }
  
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
  
  function getAverageRating(booksData: any[]): number {
    const ratedBooks = booksData.filter(book => book.rating);
    if (ratedBooks.length === 0) return 0;
    const sum = ratedBooks.reduce((acc, book) => acc + book.rating, 0);
    return sum / ratedBooks.length;
  }
  
  function getPagesPerDay(stats: ReadingStats): number {
    if (!stats.total_books_read || !stats.total_pages_read) return 0;
    // Rough estimate: assume 1 book per month average
    const estimatedDays = stats.total_books_read * 30;
    return Math.round(stats.total_pages_read / estimatedDays);
  }
</script>

<svelte:head>
  <title>Reading Statistics - Matt's Book Organizer</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Reading Statistics</h1>
    <p class="mt-1 text-gray-600 dark:text-gray-400">
      Insights into your reading habits and collection
    </p>
  </div>
  
  {#if $error}
    <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
      <div class="flex">
        <span class="text-red-500 mr-2">⚠️</span>
        <div>
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">{$error}</p>
        </div>
      </div>
    </div>
  {/if}
  
  {#if $isLoading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  {:else if readingStats}
    <!-- Overview cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card p-6 text-center">
        <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
          {readingStats.total_books_read}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Books Read</div>
      </div>
      
      <div class="card p-6 text-center">
        <div class="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
          {readingStats.total_pages_read.toLocaleString()}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Pages Read</div>
      </div>
      
      <div class="card p-6 text-center">
        <div class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
          {Math.round(readingStats.average_pages_per_book)}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Avg Pages/Book</div>
      </div>
      
      <div class="card p-6 text-center">
        <div class="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
          {getAverageRating($books).toFixed(1)}★
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Avg Rating</div>
      </div>
    </div>
    
    <!-- Charts section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Top Authors -->
      <div class="card p-6">
        <h2 class="text-xl font-semibold mb-4">Top Authors</h2>
        <div class="space-y-3">
          {#each topAuthors.slice(0, 8) as { author, count }, index}
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-4">
                {index + 1}. {author}
              </span>
              <div class="flex items-center space-x-2">
                <div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    class="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    style="width: {(count / topAuthors[0].count) * 100}%"
                  ></div>
                </div>
                <span class="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                  {count}
                </span>
              </div>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Rating Distribution -->
      <div class="card p-6">
        <h2 class="text-xl font-semibold mb-4">Rating Distribution</h2>
        <div class="space-y-3">
          {#each ratingDistribution.reverse() as { rating, count }}
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {'★'.repeat(rating)}{'☆'.repeat(5-rating)}
              </span>
              <div class="flex items-center space-x-2">
                <div class="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    class="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                    style="width: {count > 0 ? (count / Math.max(...ratingDistribution.map(r => r.count))) * 100 : 0}%"
                  ></div>
                </div>
                <span class="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                  {count}
                </span>
              </div>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Reading by Year -->
      {#if yearlyReading.length > 0}
        <div class="card p-6">
          <h2 class="text-xl font-semibold mb-4">Books Read by Year</h2>
          <div class="space-y-3">
            {#each yearlyReading.slice(-8) as { year, count }}
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {year}
                </span>
                <div class="flex items-center space-x-2">
                  <div class="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      class="bg-green-500 h-3 rounded-full transition-all duration-500"
                      style="width: {(count / Math.max(...yearlyReading.map(y => y.count))) * 100}%"
                    ></div>
                  </div>
                  <span class="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                    {count}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- Additional Stats -->
      <div class="card p-6">
        <h2 class="text-xl font-semibold mb-4">Additional Insights</h2>
        <div class="space-y-4">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Total Books:</span>
            <span class="font-medium">{$books.length}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Currently Reading:</span>
            <span class="font-medium">
              {$books.filter(b => b.exclusive_shelf === 'currently-reading').length}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">To Read:</span>
            <span class="font-medium">
              {$books.filter(b => b.exclusive_shelf === 'to-read').length}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Favorites (5⭐):</span>
            <span class="font-medium">
              {$books.filter(b => b.rating === 5).length}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Last Updated:</span>
            <span class="font-medium text-sm">
              {formatDate(readingStats.last_updated)}
            </span>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>