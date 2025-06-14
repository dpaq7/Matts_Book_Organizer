<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { isDarkMode } from '$lib/stores';
  
  onMount(() => {
    // Initialize theme from localStorage
    const stored = localStorage.getItem('darkMode');
    if (stored) {
      isDarkMode.set(JSON.parse(stored));
    }
  });
  
  // Subscribe to dark mode changes
  $: if (typeof window !== 'undefined') {
    localStorage.setItem('darkMode', JSON.stringify($isDarkMode));
    if ($isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  
  function toggleTheme() {
    isDarkMode.update(mode => !mode);
  }
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Navigation -->
  <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <a href="/" class="flex items-center space-x-2">
            <span class="text-2xl">📚</span>
            <span class="text-xl font-bold text-gray-900 dark:text-white">Matt's Books</span>
          </a>
        </div>
        
        <div class="flex items-center space-x-4">
          <a href="/stats" class="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            Statistics
          </a>
          <a href="/add" class="btn btn-primary text-sm">
            Add Book
          </a>
          <button
            on:click={toggleTheme}
            class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg"
            aria-label="Toggle theme"
          >
            {#if $isDarkMode}
              <span class="text-lg">☀️</span>
            {:else}
              <span class="text-lg">🌙</span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </nav>

  <!-- Main content -->
  <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <slot />
  </main>
</div>