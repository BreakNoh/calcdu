<script lang="ts">
	import type { CampoDias } from '#lib/calcular.ts';
	import type { ContagemDias, ContagemFeriados } from '#lib/contagem.ts';
	import { Input } from 'flowbite-svelte';

	type PropsSumario = {
		contagem: ContagemDias;
		contagemFeriados: ContagemFeriados;
		onmudar: (campo: CampoDias, valor: number) => void;
	};

	let { contagem, contagemFeriados, onmudar }: PropsSumario = $props();

	function mudar(campo: CampoDias, minimo: number, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const valor = Number(input.value);
		const normalizado = Number.isFinite(valor) ? Math.max(minimo, Math.trunc(valor)) : minimo;

		input.value = String(normalizado);
		onmudar(campo, normalizado);
	}
</script>

{#snippet Linha(rotulo: string, descricao: string, campo: CampoDias, numero: number, minimo = 0)}
	<li class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
		<div class="min-w-0">
			<p class="text-sm font-medium text-slate-900 dark:text-slate-100">{rotulo}</p>
			<p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{descricao}</p>
		</div>

		<div class="w-24 shrink-0">
			<Input
				id={campo === 'diasUteis' ? 'dias-uteis' : undefined}
				type="number"
				min={minimo}
				step="1"
				value={numero}
				aria-label={rotulo}
				onchange={(event) => mudar(campo, minimo, event)}
				class="w-full rounded-md border-slate-300 bg-white py-2 text-center text-sm font-semibold text-slate-900 tabular-nums dark:border-slate-700 dark:bg-slate-800 dark:text-white"
			/>
		</div>
	</li>
{/snippet}

<ul class="mt-5 divide-y divide-slate-200 dark:divide-slate-800">
	{@render Linha('Dias', 'Total de dias corridos', 'dias', contagem.total, 1)}
	{@render Linha(
		'Dias úteis',
		'Segunda a sexta, sem feriados',
		'diasUteis',
		contagem.du - contagemFeriados.caiEmDiaUtil
	)}
	{@render Linha('Fim de semana', 'Sábados e domingos', 'fimDeSemana', contagem.fds)}
	{@render Linha('Feriados', 'Feriados nacionais no período', 'feriados', contagemFeriados.unicos)}
</ul>
