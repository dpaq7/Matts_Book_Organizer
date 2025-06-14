<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import type { Book } from '$lib/api';
  import { isLoading, error, setLoading, clearError } from '$lib/stores';
  
  let book: Book | null = null;
  let isEditing = false;
  let editedBook: Partial<Book> = {};
  
  $: bookId = parseInt($page.params.id);
  
  onMount(async () => {
    await loadBook();
  });
  
  async function loadBook() {
    try {
      setLoading(true);
      clearError();
      book = await api.getBook(bookId);
      editedBook = { ...book };
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Failed to load book');
    } finally {
      setLoading(false);
    }
  }
  
  async function saveBook() {
    if (!book) return;
    
    try {
      setLoading(true);
      const updated = await api.updateBook(book.id, editedBook);
      book = updated;
      isEditing = false;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Failed to save book');
    } finally {
      setLoading(false);
    }
  }
  
  async function deleteBook() {
    if (!book || !confirm('Are you sure you want to delete this book?')) return;
    
    try {
      setLoading(true);
      await api.deleteBook(book.id);
      goto('/');
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Failed to delete book');
      setLoading(false);
    }
  }
  
  function cancelEdit() {
    isEditing = false;
    editedBook = { ...book };
  }
  
  function formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  }
  
  function getRatingStars(rating: number | undefined): string {
    if (!rating) return 'Not rated';
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
</script>

<svelte:head>
  <title>{book?.title || 'Book Details'} - Matt's Book Organizer</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
  <!-- Back button -->
  <div class="mb-6">
    <a href="/" class="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 text-sm font-medium">
      ← Back to library
    </a>
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
  
  {#if $isLoading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  {:else if book}
    <div class="card p-6">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
        <div class="flex-1">
          {#if isEditing}
            <input
              bind:value={editedBook.title}
              class="input text-2xl font-bold mb-2"
              placeholder="Book title"
            />
            <input
              bind:value={editedBook.author}
              class="input text-lg text-gray-600 dark:text-gray-400"
              placeholder="Author"
            />
          {:else}
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {book.title}
            </h1>
            <p class="text-xl text-gray-600 dark:text-gray-400 mb-4">
              by {book.author}
            </p>
          {/if}
        </div>
        
        <div class="flex space-x-2 mt-4 lg:mt-0">
          {#if isEditing}
            <button on:click={saveBook} class="btn btn-primary" disabled={$isLoading}>
              Save
            </button>
            <button on:click={cancelEdit} class="btn btn-secondary">
              Cancel
            </button>
          {:else}
            <button on:click={() => isEditing = true} class="btn btn-primary">
              Edit
            </button>
            <button on:click={deleteBook} class="btn bg-red-600 text-white hover:bg-red-700">
              Delete
            </button>
          {/if}
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left column -->
        <div class="space-y-6">
          <!-- Basic info -->
          <div>
            <h2 class="text-lg font-semibold mb-4">Book Information</h2>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Pages:</span>
                {#if isEditing}
                  <input type="number" bind:value={editedBook.pages} class="input w-24" />
                {:else}
                  <span>{book.pages || 'Unknown'}</span>
                {/if}
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Publisher:</span>
                {#if isEditing}
                  <input bind:value={editedBook.publisher} class="input flex-1 ml-4" />
                {:else}
                  <span>{book.publisher || 'Unknown'}</span>
                {/if}
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Published:</span>
                {#if isEditing}
                  <input type="number" bind:value={editedBook.edition_published} class="input w-24" />
                {:else}
                  <span>{book.edition_published || 'Unknown'}</span>
                {/if}
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Binding:</span>
                {#if isEditing}
                  <input bind:value={editedBook.binding} class="input flex-1 ml-4" />
                {:else}
                  <span>{book.binding || 'Unknown'}</span>
                {/if}
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">ISBN:</span>
                {#if isEditing}
                  <input bind:value={editedBook.isbn} class="input flex-1 ml-4" />
                {:else}
                  <span>{book.isbn || 'Not available'}</span>
                {/if}
              </div>
            </div>
          </div>
          
          <!-- Reading info -->
          <div>
            <h2 class="text-lg font-semibold mb-4">Reading Information</h2>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Your Rating:</span>
                {#if isEditing}
                  <select bind:value={editedBook.rating} class="input w-32">
                    <option value={undefined}>No rating</option>
                    <option value={1}>1 star</option>
                    <option value={2}>2 stars</option>
                    <option value={3}>3 stars</option>
                    <option value={4}>4 stars</option>
                    <option value={5}>5 stars</option>
                  </select>
                {:else}
                  <span>{getRatingStars(book.rating)}</span>
                {/if}
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Average Rating:</span>
                <span>{book.average_rating ? book.average_rating.toFixed(1) : 'Not rated'}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Date Read:</span>
                {#if isEditing}
                  <input type="date" bind:value={editedBook.date_read} class="input w-40" />
                {:else}
                  <span>{formatDate(book.date_read)}</span>
                {/if}
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Read Count:</span>
                {#if isEditing}
                  <input type="number" bind:value={editedBook.read_count} class="input w-20" min="0" />
                {:else}
                  <span>{book.read_count || 0} time{book.read_count !== 1 ? 's' : ''}</span>
                {/if}
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Status:</span>
                {#if isEditing}
                  <select bind:value={editedBook.exclusive_shelf} class="input w-40">
                    <option value="">No status</option>
                    <option value="to-read">To Read</option>
                    <option value="currently-reading">Currently Reading</option>
                    <option value="read">Read</option>
                  </select>
                {:else}
                  <span class="capitalize">{book.exclusive_shelf?.replace('-', ' ') || 'No status'}</span>
                {/if}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Right column -->
        <div class="space-y-6">
          <!-- BEq info -->
          {#if book.beq_value}
            <div>
              <h2 class="text-lg font-semibold mb-4">Book Equivalent (BEq)</h2>
              <div class="bg-primary-50 dark:bg-primary-900 rounded-lg p-4">
                <div class="text-center">
                  <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                    {book.beq_value}×
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {book.beq_value >= 1 
                      ? `${Math.round((book.beq_value - 1) * 100)}% larger than your average book`
                      : `${Math.round((1 - book.beq_value) * 100)}% smaller than your average book`
                    }
                  </p>
                </div>
              </div>
            </div>
          {/if}
          
          <!-- Shelves -->
          {#if book.shelves.length > 0}
            <div>
              <h2 class="text-lg font-semibold mb-4">Shelves</h2>
              <div class="flex flex-wrap gap-2">
                {#each book.shelves as shelf}
                  <span class="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                    {shelf.name}
                  </span>
                {/each}
              </div>
            </div>
          {/if}
          
          <!-- Review -->
          <div>
            <h2 class="text-lg font-semibold mb-4">Your Review</h2>
            {#if isEditing}
              <textarea
                bind:value={editedBook.my_review}
                class="input h-32 resize-none"
                placeholder="Write your review..."
              ></textarea>
            {:else if book.my_review}
              <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{book.my_review}</p>
            {:else}
              <p class="text-gray-500 dark:text-gray-400 italic">No review yet</p>
            {/if}
          </div>
          
          <!-- Private notes -->
          <div>
            <h2 class="text-lg font-semibold mb-4">Private Notes</h2>
            {#if isEditing}
              <textarea
                bind:value={editedBook.private_notes}
                class="input h-24 resize-none"
                placeholder="Private notes..."
              ></textarea>
            {:else if book.private_notes}
              <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{book.private_notes}</p>
            {:else}
              <p class="text-gray-500 dark:text-gray-400 italic">No private notes</p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>