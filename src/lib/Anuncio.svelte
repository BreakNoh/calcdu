<script lang="ts">
	import { onMount } from 'svelte';
	import { ADSENSE_CLIENT } from '#lib/ads.ts';

	type FormatoAnuncio = 'auto' | 'fluid' | 'horizontal' | 'vertical' | 'rectangle';

	type PropsAnuncio = {
		slot: string;
		formato?: FormatoAnuncio;
		layout?: 'in-article';
		responsivo?: boolean;
		class?: string;
	};

	let {
		slot,
		formato = 'auto',
		layout,
		responsivo = true,
		class: classe = ''
	}: PropsAnuncio = $props();

	let anuncio = $state<HTMLElement>();

	onMount(() => {
		if (!anuncio || !slot) {
			return;
		}

		try {
			window.adsbygoogle = window.adsbygoogle || [];
			window.adsbygoogle.push({});
		} catch {
			// O script do AdSense pode estar bloqueado; o espaço reservado permanece.
		}
	});
</script>

<div class="flex flex-col {classe}">
	<span
		class="mb-1 text-[10px] font-medium tracking-wider text-slate-400 uppercase dark:text-slate-600"
	>
		Publicidade
	</span>
	<ins
		bind:this={anuncio}
		class="adsbygoogle block w-full"
		style="display: block"
		data-ad-client={ADSENSE_CLIENT}
		data-ad-slot={slot}
		data-ad-format={formato}
		data-full-width-responsive={responsivo ? 'true' : 'false'}
		data-ad-layout={layout}
	></ins>
</div>
