<script lang="ts">
	import './layout.css';
	import type { LayoutProps } from './$types';
	import { ADSENSE_CLIENT, ADS_ENABLED } from '#lib/ads.ts';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/manifest.webmanifest" />
	<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#020617" media="(prefers-color-scheme: dark)" />
	{#if ADS_ENABLED}
		<meta name="google-adsense-account" content={ADSENSE_CLIENT} />
		<script
			async
			src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
			crossorigin="anonymous"
		></script>
	{/if}
</svelte:head>

{@render children()}
