<script lang="ts">
  import './styles.css';
  import { writable } from 'svelte/store';

  const store$ = writable({});
  store$.set({ name: 'Ion' });
</script>

<div class="bg-gray-50">
  <div class="g-container">
    <h2 class="g-g2">
      <span class="block">Ready to dive in?</span>
      <span class="block text-indigo-600">Start today.</span>
    </h2>
    <div class="mt-8 flex lg:mt-0 lg:flex-shrink-0">
      <div class="inline-flex rounded-md shadow">
        <button
          class="g-btn-primary"
          disabled>Get started</button
        >
      </div>
      <div class="ml-3 inline-flex rounded-md shadow">
        <button
          class="g-btn-secondary"
          disabled>Learn more</button
        >
      </div>
    </div>
  </div>
</div>
