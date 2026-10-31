<script lang="ts">
	import type { CampoDias } from '#lib/calcular.ts';
	import type { ContagemDias, ContagemFeriados } from '#lib/contagem.ts';
	import { copiarTexto } from '#lib/util.ts';
	import { Input } from 'flowbite-svelte';
	import { CheckOutline, ChevronDownOutline, ClipboardOutline } from 'flowbite-svelte-icons';

	type PropsSumario = {
		contagem: ContagemDias;
		contagemFeriados: ContagemFeriados;
		onmudar: (campo: CampoDias, valor: number) => void;
	};

	let { contagem, contagemFeriados, onmudar }: PropsSumario = $props();

	let copiado = $state<string | null>(null);
	let tempoCopiado: ReturnType<typeof setTimeout> | undefined;

	const DIAS_SEMANA = [
		{ chave: 'segunda', rotulo: 'Segunda' },
		{ chave: 'terca', rotulo: 'Terça' },
		{ chave: 'quarta', rotulo: 'Quarta' },
		{ chave: 'quinta', rotulo: 'Quinta' },
		{ chave: 'sexta', rotulo: 'Sexta' },
		{ chave: 'sabado', rotulo: 'Sábado' },
		{ chave: 'domingo', rotulo: 'Domingo' }
	] as const;

	let aberto = $state<CampoDias | null>(null);

	function alternar(campo: CampoDias) {
		aberto = aberto === campo ? null : campo;
	}

	function detalhesPorDia(campo: CampoDias) {
		return DIAS_SEMANA.filter(({ chave }) => {
			if (campo === 'diasUteis') {
				return chave !== 'sabado' && chave !== 'domingo';
			}

			if (campo === 'fimDeSemana') {
				return chave === 'sabado' || chave === 'domingo';
			}

			return true;
		}).map(({ chave, rotulo }) => {
			if (campo === 'feriados') {
				return { chave, rotulo, valor: contagemFeriados.porDiaSemana[chave] };
			}

			const feriados = campo === 'diasUteis' ? contagemFeriados.porDiaSemana[chave] : 0;

			return { chave, rotulo, valor: contagem[chave] - feriados };
		});
	}

	function mudar(campo: CampoDias, minimo: number, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const valor = Number(input.value);
		const normalizado = Number.isFinite(valor) ? Math.max(minimo, Math.trunc(valor)) : minimo;

		input.value = String(normalizado);
		onmudar(campo, normalizado);
	}

	async function copiar(chave: string, valor: number) {
		await copiarTexto(String(valor));

		copiado = chave;
		clearTimeout(tempoCopiado);
		tempoCopiado = setTimeout(() => {
			copiado = null;
		}, 2000);
	}
</script>

{#snippet Linha(rotulo: string, descricao: string, campo: CampoDias, numero: number, minimo = 0)}
	<li class="group py-3 first:pt-0 last:pb-0">
		<div class="flex items-center justify-between gap-4">
			<button
				type="button"
				class="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
				onclick={() => alternar(campo)}
				aria-expanded={aberto === campo}
				aria-controls={`detalhes-${campo}`}
				title={aberto === campo
					? `Recolher ${rotulo.toLowerCase()}`
					: `Expandir ${rotulo.toLowerCase()}`}
			>
				<span class="min-w-0">
					<span class="block text-sm font-medium text-slate-900 dark:text-slate-100">
						{rotulo}
					</span>
					<span class="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
						{descricao}
					</span>
				</span>
				<ChevronDownOutline
					class="h-4 w-4 shrink-0 text-slate-400 transition-transform dark:text-slate-500 {aberto ===
					campo
						? 'rotate-180'
						: ''}"
				/>
			</button>

			<div class="flex shrink-0 items-center gap-1.5">
				<button
					type="button"
					class="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-100 {copiado ===
					campo
						? 'opacity-100'
						: 'opacity-0 group-hover:opacity-100'}"
					onclick={() => copiar(campo, numero)}
					aria-label={`Copiar ${rotulo.toLowerCase()}`}
					title={copiado === campo ? 'Copiado!' : `Copiar ${rotulo.toLowerCase()}`}
				>
					{#if copiado === campo}
						<CheckOutline class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
					{:else}
						<ClipboardOutline class="h-4 w-4" />
					{/if}
					<span class="sr-only" aria-live="polite">{copiado === campo ? 'Copiado' : ''}</span>
				</button>

				<div class="w-24">
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
			</div>
		</div>

		{#if aberto === campo}
			<div
				id={`detalhes-${campo}`}
				class="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40"
			>
				<p
					class="text-[11px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400"
				>
					Por dia da semana
				</p>

				<div class="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
					{#each detalhesPorDia(campo) as detalhe (detalhe.chave)}
						<button
							type="button"
							class="group/dia flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs transition focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none {copiado ===
							`${campo}-${detalhe.chave}`
								? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40'
								: 'bg-white hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-700'}"
							onclick={() => copiar(`${campo}-${detalhe.chave}`, detalhe.valor)}
							aria-label={`Copiar ${detalhe.rotulo.toLowerCase()}: ${detalhe.valor}`}
							title={copiado === `${campo}-${detalhe.chave}`
								? 'Copiado!'
								: `Copiar ${detalhe.rotulo.toLowerCase()}`}
						>
							<span class="text-slate-500 dark:text-slate-400">{detalhe.rotulo}</span>
							<span
								class="flex items-center gap-1 font-semibold tabular-nums {copiado ===
								`${campo}-${detalhe.chave}`
									? 'text-emerald-700 dark:text-emerald-400'
									: 'text-slate-900 dark:text-slate-100'}"
							>
								{detalhe.valor}
								{#if copiado === `${campo}-${detalhe.chave}`}
									<CheckOutline class="h-3 w-3" />
								{:else}
									<ClipboardOutline
										class="h-3 w-3 text-slate-400 opacity-0 transition-opacity group-hover/dia:opacity-100 group-focus-visible/dia:opacity-100 dark:text-slate-500"
									/>
								{/if}
							</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}
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
