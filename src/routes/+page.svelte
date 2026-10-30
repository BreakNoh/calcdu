<script lang="ts">
	import {
		ArrowRightOutline,
		CalendarMonthSolid,
		InfoCircleOutline,
		LockOpenSolid,
		LockSolid,
		MoonSolid,
		SunSolid
	} from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import { Datepicker } from 'flowbite-svelte';
	import {
		contarDias,
		contarFeriados,
		type ContagemDias,
		type ContagemFeriados
	} from '#lib/contagem.ts';
	import {
		adicionarDiasCorridos,
		adicionarDiasUteisComFeriados,
		adicionarFeriados,
		adicionarFinaisDeSemana,
		type CampoDias
	} from '#lib/calcular.ts';
	import { datePraPlainDate, plainDatePraDate } from '#lib/util.ts';
	import Calendario from './Calendario.svelte';
	import Sumario from './Sumario.svelte';

	let deData = $state(new Date());
	let ateData = $state(new Date());

	let contagem = $state<ContagemDias>();
	let contagemFeriados = $state<ContagemFeriados>();

	let dataTravada = $state<'de' | 'ate' | null>(null);
	let ultimaAtualizacao = 0;

	let escuro = $state(false);

	onMount(() => {
		const salvo = localStorage.getItem('tema');
		escuro = salvo ? salvo === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
	});

	const travadaAte = $derived(dataTravada === 'ate');
	const dataReferencia = $derived(travadaAte ? ateData : deData);

	let focoInicialFeito = false;

	$effect(() => {
		document.documentElement.classList.toggle('dark', escuro);
	});

	$effect(() => {
		if (focoInicialFeito || !contagem || !contagemFeriados) {
			return;
		}

		focoInicialFeito = true;
		document.getElementById('dias-uteis')?.focus();
	});

	function alternarTema() {
		escuro = !escuro;
		localStorage.setItem('tema', escuro ? 'dark' : 'light');
	}

	function alternarTrava(data: 'de' | 'ate') {
		dataTravada = dataTravada === data ? null : data;
		ultimaAtualizacao += 1;
	}

	function diaDaSemana(data: Date) {
		if (!(data instanceof Date) || Number.isNaN(data.getTime())) return '';
		return data.toLocaleDateString('pt-BR', { weekday: 'long' });
	}

	async function mudarDias(campo: CampoDias, valor: number) {
		const referencia = datePraPlainDate(travadaAte ? ateData : deData);
		const direcao: 1 | -1 = travadaAte ? -1 : 1;
		const quantidade = Math.max(0, Math.trunc(valor));
		const atualizacao = ++ultimaAtualizacao;

		let novaData = referencia;

		switch (campo) {
			case 'dias':
				novaData = adicionarDiasCorridos(referencia, direcao * (Math.max(1, quantidade) - 1));
				break;
			case 'diasUteis':
				novaData = await adicionarDiasUteisComFeriados(referencia, quantidade, direcao);
				break;
			case 'fimDeSemana':
				novaData = adicionarFinaisDeSemana(referencia, quantidade, direcao);
				break;
			case 'feriados':
				novaData = await adicionarFeriados(referencia, quantidade, direcao);
				break;
		}

		if (atualizacao === ultimaAtualizacao) {
			if (travadaAte) {
				deData = plainDatePraDate(novaData);
			} else {
				ateData = plainDatePraDate(novaData);
			}
		}
	}

	function definirIntervalo(novoDe: Date, novoAte: Date) {
		ultimaAtualizacao += 1;
		deData = novoDe;
		ateData = novoAte;
	}

	$effect(() => {
		if (!deData || !ateData) {
			return;
		}

		const de = datePraPlainDate(deData);
		const ate = datePraPlainDate(ateData);

		contagem = contarDias(de, ate);

		let cancelado = false;

		contarFeriados(de, ate).then((v) => {
			if (!cancelado) {
				contagemFeriados = v;
			}
		});

		return () => {
			cancelado = true;
		};
	});
</script>

<svelte:head>
	<title>Calculadora de datas</title>
	<meta
		name="description"
		content="Calcule intervalos entre datas por dias corridos, dias úteis, fins de semana e feriados."
	/>
</svelte:head>

<div
	class="min-h-dvh bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
>
	<div class="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:py-12">
		<header class="flex items-start justify-between gap-4">
			<div class="flex items-start gap-4">
				<div
					class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-600/20"
					aria-hidden="true"
				>
					<CalendarMonthSolid class="h-6 w-6" />
				</div>
				<div>
					<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Calculadora de datas</h1>
					<p class="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
						Escolha o intervalo, trave uma data como referência e ajuste a contagem.
					</p>
				</div>
			</div>

			<button
				type="button"
				class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-offset-slate-950"
				onclick={alternarTema}
				aria-label={escuro ? 'Ativar tema claro' : 'Ativar tema escuro'}
				title={escuro ? 'Ativar tema claro' : 'Ativar tema escuro'}
			>
				{#if escuro}
					<SunSolid class="h-5 w-5" />
				{:else}
					<MoonSolid class="h-5 w-5" />
				{/if}
			</button>
		</header>

		<main
			class="mt-8 grid flex-1 items-start gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
		>
			<section
				class="rounded-xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6 dark:border-slate-800 dark:bg-slate-900/80"
				aria-labelledby="titulo-periodo"
			>
				<div class="flex flex-wrap items-center justify-between gap-3">
					<h2 id="titulo-periodo" class="text-base font-semibold">Período</h2>

					<span
						class="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium {dataTravada
							? 'bg-primary-100 text-primary-900 dark:bg-primary-900/50 dark:text-primary-50'
							: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}"
					>
						{#if dataTravada}
							<LockSolid class="h-3.5 w-3.5" />
							{dataTravada === 'ate' ? 'Data final fixa' : 'Data inicial fixa'}
						{:else}
							Data inicial como referência
						{/if}
					</span>
				</div>

				<div class="mt-5 flex flex-col gap-3 md:flex-row md:items-stretch">
					<div
						class="flex-1 rounded-lg border p-4 transition-colors {dataTravada === 'de'
							? 'border-primary-400 bg-primary-50/70 ring-1 ring-primary-400 dark:border-primary-500 dark:bg-primary-900/25 dark:ring-primary-900'
							: 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40'}"
					>
						<div class="flex items-center justify-between gap-2">
							<label
								for="data-inicial"
								class="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
							>
								Data inicial
							</label>

							<button
								type="button"
								class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-slate-900 {dataTravada ===
								'de'
									? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 dark:bg-primary-500 dark:text-slate-950 dark:hover:bg-primary-400'
									: 'bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white'}"
								onclick={() => alternarTrava('de')}
								aria-pressed={dataTravada === 'de'}
								aria-label={dataTravada === 'de'
									? 'Destravar data inicial'
									: 'Travar data inicial como referência'}
								title={dataTravada === 'de'
									? 'Destravar data inicial'
									: 'Travar data inicial como referência'}
							>
								{#if dataTravada === 'de'}
									<LockSolid class="h-5 w-5" />
								{:else}
									<LockOpenSolid class="h-5 w-5" />
								{/if}
							</button>
						</div>

						<Datepicker
							bind:value={deData}
							availableTo={ateData}
							disabled={dataTravada === 'de'}
							locale="pt-BR"
							dateFormat={{ day: '2-digit', month: '2-digit', year: 'numeric' }}
							placeholder="Selecione a data"
							inputClass="mt-3 rounded-md border-slate-300 bg-white py-3 font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
							inputProps={{
								id: 'data-inicial',
								'aria-describedby': 'ajuda-data-inicial'
							}}
						/>

						<p
							id="ajuda-data-inicial"
							class="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300"
						>
							{#if dataTravada === 'de'}
								<LockSolid class="h-3.5 w-3.5 text-primary-600 dark:text-primary-300" />
								Usada como referência dos cálculos
							{:else if diaDaSemana(deData)}
								<span class="capitalize">{diaDaSemana(deData)}</span>
							{/if}
						</p>
					</div>

					<div class="flex items-center justify-center text-primary-500 dark:text-primary-300">
						<ArrowRightOutline class="h-5 w-5 rotate-90 md:rotate-0" aria-hidden="true" />
					</div>

					<div
						class="flex-1 rounded-lg border p-4 transition-colors {dataTravada === 'ate'
							? 'border-primary-400 bg-primary-50/70 ring-1 ring-primary-400 dark:border-primary-500 dark:bg-primary-900/25 dark:ring-primary-900'
							: 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40'}"
					>
						<div class="flex items-center justify-between gap-2">
							<label
								for="data-final"
								class="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
							>
								Data final
							</label>

							<button
								type="button"
								class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-slate-900 {dataTravada ===
								'ate'
									? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 dark:bg-primary-500 dark:text-slate-950 dark:hover:bg-primary-400'
									: 'bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white'}"
								onclick={() => alternarTrava('ate')}
								aria-pressed={dataTravada === 'ate'}
								aria-label={dataTravada === 'ate'
									? 'Destravar data final'
									: 'Travar data final como referência'}
								title={dataTravada === 'ate'
									? 'Destravar data final'
									: 'Travar data final como referência'}
							>
								{#if dataTravada === 'ate'}
									<LockSolid class="h-5 w-5" />
								{:else}
									<LockOpenSolid class="h-5 w-5" />
								{/if}
							</button>
						</div>

						<Datepicker
							bind:value={ateData}
							availableFrom={deData}
							disabled={dataTravada === 'ate'}
							locale="pt-BR"
							dateFormat={{ day: '2-digit', month: '2-digit', year: 'numeric' }}
							placeholder="Selecione a data"
							inputClass="mt-3 rounded-md border-slate-300 bg-white py-3 font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
							inputProps={{
								id: 'data-final',
								'aria-describedby': 'ajuda-data-final'
							}}
						/>

						<p
							id="ajuda-data-final"
							class="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300"
						>
							{#if dataTravada === 'ate'}
								<LockSolid class="h-3.5 w-3.5 text-primary-600 dark:text-primary-300" />
								Usada como referência dos cálculos
							{:else if diaDaSemana(ateData)}
								<span class="capitalize">{diaDaSemana(ateData)}</span>
							{/if}
						</p>
					</div>
				</div>

				<div
					class="mt-5 flex items-start gap-3 rounded-lg border border-primary-200/70 bg-primary-50/60 p-4 text-sm text-primary-900 dark:border-primary-800/70 dark:bg-primary-900/25 dark:text-primary-100"
				>
					<InfoCircleOutline
						class="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-300"
					/>
					<p>
						{#if dataTravada === 'ate'}
							Os valores do resumo são contados a partir da <strong>data final</strong>, voltando no
							tempo e atualizando a data inicial.
						{:else if dataTravada === 'de'}
							Os valores do resumo são contados a partir da <strong>data inicial</strong>, avançando
							no tempo e atualizando a data final.
						{:else}
							Nenhuma data está travada, então a <strong>data inicial</strong> é usada como referência
							padrão. Use o cadeado ao lado de uma data para fixá-la.
						{/if}
					</p>
				</div>

				<Calendario de={deData} ate={ateData} ondefinir={definirIntervalo} />
			</section>

			<section
				class="rounded-xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6 dark:border-slate-800 dark:bg-slate-900/80"
				aria-labelledby="titulo-resumo"
			>
				<div class="flex items-start justify-between gap-3">
					<div>
						<h2 id="titulo-resumo" class="text-base font-semibold">Resumo</h2>
						<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
							Edite um valor para recalcular o intervalo.
						</p>
					</div>
				</div>

				{#if contagem && contagemFeriados}
					<Sumario {contagem} {contagemFeriados} onmudar={mudarDias} />
				{:else}
					<div class="mt-5 h-56 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"></div>
				{/if}

				<p
					class="mt-5 flex items-center gap-1.5 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-300"
				>
					<LockSolid class="h-3.5 w-3.5 text-primary-600 dark:text-primary-300" />
					Referência atual:
					<span class="font-medium text-slate-700 capitalize dark:text-white">
						{dataTravada === 'ate' ? 'data final' : 'data inicial'}
					</span>
					{#if dataReferencia && diaDaSemana(dataReferencia)}
						· <span class="capitalize">{diaDaSemana(dataReferencia)}</span>
					{/if}
				</p>
			</section>
		</main>

		<footer class="mt-8 text-xs text-slate-500 dark:text-slate-400">
			Contagem inclusiva: a data inicial e a data final fazem parte do intervalo.
		</footer>
	</div>
</div>
