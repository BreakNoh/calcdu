<script lang="ts">
	import { contarDias, contarFeriados } from '#lib/contagem.ts';

	let deDataRaw = $state(Temporal.Now.plainDateISO().toString());
	let ateDataRaw = $state(Temporal.Now.plainDateISO().toString());
	let deData = $state(Temporal.Now.plainDateISO());
	let ateData = $state(Temporal.Now.plainDateISO());

	let contagem = $derived(contarDias(deData, ateData));

	$effect(() => {
		try {
			deData = Temporal.PlainDate.from(deDataRaw);
			ateData = Temporal.PlainDate.from(ateDataRaw);
		} catch {
			alert('Data Inválida');
		}
	});
</script>

<label for="data-de">de data</label>
<input type="date" id="data-de" bind:value={deDataRaw} />

<label for="data-ate">até data</label>
<input type="date" id="data-ate" bind:value={ateDataRaw} />

<p>
	<span>Dias Corridos</span>
	{contagem.total}
	<br />
	{#await contarFeriados(deData, ateData) then feriados}
		<span>Dias Úteis</span>
		{contagem.du - feriados.total}
		<br />
		<span>Feriados</span>
		{feriados.total}
	{/await}
	<br />
	<span>Finais de Semana</span>
	{contagem.fds}
</p>
