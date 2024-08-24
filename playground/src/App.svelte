<script lang="ts">
  import { onMount } from 'svelte';
  import Lexico, { BinaryCmp, FuzzyCmp, PrefixCmp } from '../../src';
  import lexicoPkg from '../../package.json';

  const exampleQueries = [
    'pikachu',
    'saur',
    'weight:>100 height:<1',
    'swift defense:>50',
    'type:!water attack:<2',
    '"type: null"'
  ]

  const lexico = new Lexico({
    comparator: new BinaryCmp(),
    // indexes: ['name'],
  });

  let pokedex = [];
  let results = [];
  let search = "";

  onMount(() => {
    fetch('https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/pokedex.json')
      .then(res => res.json())
      .then(data => {
        data.forEach(pokemon => {
          pokemon.name = pokemon.name.english
          pokemon.attack = pokemon.base?.Attack ?? 0;
          pokemon.defense = pokemon.base?.Defense ?? 0;
          pokemon.weight = Number(pokemon.profile.weight.replace(' kg', ''));
          pokemon.height = Number(pokemon.profile.height.replace(' m', ''));

          lexico.addRecord(pokemon);
        });
        pokedex = data;
      })
  })

  $: {
    if (search) {
      results = lexico.search(search).map((data) => data.record);
    } else {
      results = pokedex;
    }
  }
</script>

<main class="relative container mx-auto px-8 flex flex-col items-center pt-28 pb-48 min-h-screen border-x border-gray-400 bg-gray-100">
  <div class="absolute top-4 right-8 text-xs">lexico v{lexicoPkg.version}</div>

  <h1 class="text-4xl font-semibold mb-4">🔭 Lexico search demo</h1>
  <p>
    A demo of the
    <a href="https://github.com/blenderskool/lexico" target="_blank" class="text-violet-600 font-semibold hover:text-violet-800">
      Lexico
    </a>
    search library.
    Dataset from
    <a href="https://github.com/Purukitto/pokemon-data.json" target="_blank" class="text-violet-600 font-semibold hover:text-violet-800">
      Purukitto/pokemon-data.json
    </a>
  </p>

  <input
    bind:value={search}
    class="mt-28 shadow-xl shadow-gray-700/5 text-lg text-gray-900 px-6 py-3 w-full sm:w-1/2 border-2 border-gray-800 focus:outline-none focus:border-violet-600 placeholder:text-gray-700"
    placeholder="Search query..."
    type="search"
  />

  <div class="mt-16 flex flex-col items-center">
    <h2 class="text-xl font-semibold mb-4">Example search queries</h2>
    <ul class="gap-2 flex flex-col md:flex-row">
      {#each exampleQueries as query}
        <li>
          <button
            on:click={() => search = query}
            class="border-2 border-gray-800 py-0.5 px-3 bg-white hover:text-violet-600 hover:border-violet-600 hover:scale-[1.02]"
          >
            {query}
          </button>
        </li>
      {/each}
    </ul>
  </div>

  <div class="self-end mt-16">{results.length} results</div>
  <div class="slide-in grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 mt-4  w-full">
    {#each results as pokemon (pokemon.name)}
      <div
        class="bg-white border-2 border-gray-800 p-5 flex flex-col items-center text-center"
      >
        <img src={pokemon.image.hires} alt={`${pokemon.name}'s image`} class="h-24" loading="lazy" />
        <h2 class="text-xl font-semibold capitalize mt-6">{pokemon.name}</h2>
        <p class="text-xs mt-2 mb-4">
          {pokemon.description}
        </p>
        <p class="text-sm mt-auto">
          Height: {pokemon.height}
          <br />
          Weight: {pokemon.weight}
          <br />
          Attack: {pokemon.attack}
          <br />
          Defense: {pokemon.defense}
        </p>
      </div>
    {/each}
  </div>
</main>

<style>
  .slide-in {
    animation: slide-in 1s ease;
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }

    to {
      opacity: 1;
      transform: translate(0);
    }
  }
</style>
