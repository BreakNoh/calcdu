<script lang="ts">
	import { LockSolid, LockOpenSolid } from 'flowbite-svelte-icons';
	import { Datepicker, Span, type DateOrRange } from 'flowbite-svelte';
	import {
		contarDias,
		contarFeriados,
		type ContagemDias,
		type ContagemFeriados
	} from '#lib/contagem.ts';
	import { datePraPlainDate } from '#lib/util.ts';
	import Sumario from './Sumario.svelte';

	let deData = $state(new Date());
	let ateData = $state(new Date());

	let contagem = $state<ContagemDias>();
	let contagemFeriados = $state<ContagemFeriados>();

	$effect(() => {
		if (!deData || !ateData) {
			return;
		}

		const de = datePraPlainDate(deData);
		const ate = datePraPlainDate(ateData);

		contagem = contarDias(de, ate);
		contarFeriados(de, ate).then((v) => (contagemFeriados = v));
	});
</script>

<LockSolid />
<LockOpenSolid />

<div id="selecao-intervalo">
	<Datepicker bind:value={deData} disabled />
	<Span>até</Span>
	<Datepicker bind:value={ateData} availableFrom={deData} />
</div>

<!-- <Datepicker range bind:rangeFrom={deData} bind:rangeTo={ateData} /> -->

{#if contagem && contagemFeriados}
	<Sumario {contagem} {contagemFeriados} />
{/if}

<style>
	div#selecao-intervalo {
		display: flex;
		gap: 18px;
	}
</style>
