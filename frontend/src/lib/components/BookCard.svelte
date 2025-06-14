<script>
  
  export let book;
  
  function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  }
  
  function getRatingStars(rating) {
    if (!rating) return '';
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
  
  function getBeqDisplay(beq) {
    if (!beq) return '';
    return beq >= 1 ? `${beq}× larger` : `${Math.round(beq * 100)}% size`;
  }
</script>

<div class="card p-4 hover:shadow-md transition-shadow duration-200">
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex-1">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
        {book.title}
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
        by {book.author}
      </p>
      
      <!-- Book details -->
      <div class="space-y-1 text-xs text-gray-500 dark:text-gray-400">
        {#if book.pages}
          <div class="flex justify-between">
            <span>{book.pages} pages</span>
            {#if book.beq_value}
              <span class="font-medium" title="Book Equivalent - relative to your average book size">
                {getBeqDisplay(book.beq_value)}
              </span>
            {/if}
          </div>
        {/if}
        
        {#if book.publisher}
          <div>{book.publisher}</div>
        {/if}
        
        {#if book.edition_published}
          <div>Published: {book.edition_published}</div>
        {/if}
      </div>
    </div>
    
    <!-- Footer -->
    <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <!-- Rating -->
        <div class="flex items-center space-x-2">
          {#if book.rating}
            <span class="text-yellow-500" title="Your rating">
              {getRatingStars(book.rating)}
            </span>
          {/if}
          {#if book.average_rating}
            <span class="text-xs text-gray-500 dark:text-gray-400">
              avg: {book.average_rating.toFixed(1)}
            </span>
          {/if}
        </div>
        
        <!-- Status badge -->
        {#if book.exclusive_shelf}
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
            {book.exclusive_shelf === 'read' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
             book.exclusive_shelf === 'currently-reading' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
             'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}">
            {book.exclusive_shelf.replace('-', ' ')}
          </span>
        {/if}
      </div>
      
      <!-- Date read -->
      {#if book.date_read}
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Read: {formatDate(book.date_read)}
        </div>
      {/if}
      
      <!-- Shelves -->
      {#if book.shelves.length > 0}
        <div class="mt-2 flex flex-wrap gap-1">
          {#each book.shelves.slice(0, 3) as shelf}
            <span class="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
              {shelf.name}
            </span>
          {/each}
          {#if book.shelves.length > 3}
            <span class="text-xs text-gray-500 dark:text-gray-400">
              +{book.shelves.length - 3} more
            </span>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>