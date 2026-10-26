<script lang="ts">
	import type { ContagemDias, ContagemFeriados } from '#lib/contagem.ts';
	import { Span } from 'flowbite-svelte';
	import { LockSolid } from 'flowbite-svelte-icons';

	type PropsSumario = {
		contagem: ContagemDias;
		contagemFeriados: ContagemFeriados;
	};

	let { contagem, contagemFeriados }: PropsSumario = $props();
</script>

{#snippet Linha(rotulo: string, numero: number)}
	<li>
		<Span>{rotulo}</Span>
		<Span>{numero}</Span>
	</li>
{/snippet}

<ul>
	{@render Linha('Dias', contagem.total)}
	{@render Linha('Dias úteis', contagem.du - contagemFeriados.caiEmDiaUtil)}
	{@render Linha('Fim de semana', contagem.fds)}
	{@render Linha('Feriados', contagemFeriados.unicos)}
</ul>

<style>
	ul {
	}
	li {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}
</style>
