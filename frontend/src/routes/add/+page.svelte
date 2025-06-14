<script>
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { isLoading, error, setLoading, clearError } from '$lib/stores';
  
  let newBook = {
    title: '',
    author: '',
    pages: undefined,
    publisher: '',
    edition_published: undefined,
    rating: undefined,
    exclusive_shelf: 'to-read',
    my_review: '',
    private_notes: ''
  };
  
  async function saveBook() {
    if (!newBook.title || !newBook.author) {
      error.set('Title and author are required');
      return;
    }
    
    try {
      setLoading(true);
      clearError();
      const created = await api.createBook(newBook);
      goto(`/book/${created.id}`);
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Failed to create book');
    } finally {
      setLoading(false);
    }
  }
  
  function resetForm() {
    newBook = {
      title: '',
      author: '',
      pages: undefined,
      publisher: '',
      edition_published: undefined,
      rating: undefined,
      exclusive_shelf: 'to-read',
      my_review: '',
      private_notes: ''
    };
    clearError();
  }
</script>

<svelte:head>
  <title>Add Book - Matt's Book Organizer</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
  <!-- Back button -->
  <div class="mb-6">
    <a href="/" class="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 text-sm font-medium">
      ← Back to library
    </a>
  </div>
  
  <div class="card p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Add New Book</h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">
        Add a new book to your collection
      </p>
    </div>
    
    {#if $error}
      <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
        <div class="flex">
          <span class="text-red-500 mr-2">⚠️</span>
          <div>
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
            <p class="mt-1 text-sm text-red-700 dark:text-red-300">{$error}</p>
          </div>
        </div>
      </div>
    {/if}
    
    <form on:submit|preventDefault={saveBook} class="space-y-6">
      <!-- Required fields -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title *
          </label>
          <input
            id="title"
            type="text"
            bind:value={newBook.title}
            required
            class="input"
            placeholder="Enter book title"
          />
        </div>
        
        <div>
          <label for="author" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Author *
          </label>
          <input
            id="author"
            type="text"
            bind:value={newBook.author}
            required
            class="input"
            placeholder="Enter author name"
          />
        </div>
      </div>
      
      <!-- Book details -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="pages" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pages
          </label>
          <input
            id="pages"
            type="number"
            bind:value={newBook.pages}
            min="1"
            class="input"
            placeholder="Number of pages"
          />
        </div>
        
        <div>
          <label for="published" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Year Published
          </label>
          <input
            id="published"
            type="number"
            bind:value={newBook.edition_published}
            min="1000"
            max="2030"
            class="input"
            placeholder="YYYY"
          />
        </div>
        
        <div>
          <label for="rating" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your Rating
          </label>
          <select id="rating" bind:value={newBook.rating} class="input">
            <option value={undefined}>No rating</option>
            <option value={1}>1 star</option>
            <option value={2}>2 stars</option>
            <option value={3}>3 stars</option>
            <option value={4}>4 stars</option>
            <option value={5}>5 stars</option>
          </select>
        </div>
      </div>
      
      <!-- Publisher and ISBN -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="publisher" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Publisher
          </label>
          <input
            id="publisher"
            type="text"
            bind:value={newBook.publisher}
            class="input"
            placeholder="Publisher name"
          />
        </div>
        
        <div>
          <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reading Status
          </label>
          <select id="status" bind:value={newBook.exclusive_shelf} class="input">
            <option value="to-read">To Read</option>
            <option value="currently-reading">Currently Reading</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>
      
      <!-- Review -->
      <div>
        <label for="review" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Your Review
        </label>
        <textarea
          id="review"
          bind:value={newBook.my_review}
          rows="4"
          class="input resize-none"
          placeholder="Write your thoughts about this book..."
        ></textarea>
      </div>
      
      <!-- Private notes -->
      <div>
        <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Private Notes
        </label>
        <textarea
          id="notes"
          bind:value={newBook.private_notes}
          rows="3"
          class="input resize-none"
          placeholder="Personal notes (only visible to you)..."
        ></textarea>
      </div>
      
      <!-- Action buttons -->
      <div class="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          on:click={resetForm}
          class="btn btn-secondary w-full sm:w-auto"
          disabled={$isLoading}
        >
          Reset Form
        </button>
        <button
          type="submit"
          class="btn btn-primary w-full sm:w-auto"
          disabled={$isLoading || !newBook.title || !newBook.author}
        >
          {#if $isLoading}
            <span class="animate-spin mr-2">⏳</span>
            Adding Book...
          {:else}
            Add Book
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>