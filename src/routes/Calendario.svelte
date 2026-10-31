<script lang="ts">
	import { untrack } from 'svelte';
	import {
		CalendarMonthSolid,
		ChevronDownOutline,
		ChevronLeftOutline,
		ChevronRightOutline
	} from 'flowbite-svelte-icons';
	import { pegarFeriadosIntervalo, type FeriadoBrasilAPI } from '#lib/feriados.ts';
	import { datePraPlainDate, plainDatePraDate } from '#lib/util.ts';

	type PropsCalendario = {
		de: Date;
		ate: Date;
		ondefinir?: (de: Date, ate: Date) => void;
		aberto?: boolean;
		onalternar?: () => void;
	};

	let { de, ate, ondefinir, aberto = true, onalternar }: PropsCalendario = $props();

	const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

	const formatadorMes = new Intl.DateTimeFormat('pt-BR', {
		month: 'long',
		year: 'numeric'
	});
	const formatadorData = new Intl.DateTimeFormat('pt-BR', {
		weekday: 'long',
		day: '2-digit',
		month: 'long',
		year: 'numeric'
	});
	const formatadorDataCurta = new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: 'short'
	});

	const inicio = $derived(datePraPlainDate(de));
	const fim = $derived(datePraPlainDate(ate));
	const hoje = Temporal.Now.plainDateISO();

	let anoVisivel = $state(untrack(() => de.getFullYear()));
	let mesVisivel = $state(untrack(() => de.getMonth() + 1));

	let feriados = $state<FeriadoBrasilAPI[]>([]);
	let anosCarregados = $state<{ de: number; ate: number } | null>(null);

	let selecaoPendente = $state<Temporal.PlainDate | null>(null);
	let diaAtivo = $state<Temporal.PlainDate | null>(null);
	let diaFixado = $state<Temporal.PlainDate | null>(null);

	let deAnterior: number | null = null;
	let ateAnterior: number | null = null;

	const diaDetalhe = $derived(diaFixado ?? diaAtivo ?? inicio);

	const feriadosPorData = $derived.by(() => {
		const mapa = new Map<string, string[]>();

		for (const feriado of feriados) {
			const chave = feriado.date.slice(0, 10);
			const nomes = mapa.get(chave);

			if (nomes) {
				nomes.push(feriado.name);
			} else {
				mapa.set(chave, [feriado.name]);
			}
		}

		return mapa;
	});

	const celulas = $derived.by(() => {
		const primeiro = new Temporal.PlainDate(anoVisivel, mesVisivel, 1);
		const vazios = primeiro.dayOfWeek % 7;
		const lista: Array<Temporal.PlainDate | null> = Array.from({ length: vazios }, () => null);

		for (let dia = 1; dia <= primeiro.daysInMonth; dia++) {
			lista.push(new Temporal.PlainDate(anoVisivel, mesVisivel, dia));
		}

		while (lista.length < 42) {
			lista.push(null);
		}

		return lista;
	});

	const rotuloMes = $derived(formatadorMes.format(new Date(anoVisivel, mesVisivel - 1, 1)));

	$effect(() => {
		const deAno = de.getFullYear();
		const ateAno = ate.getFullYear();

		if (anosCarregados?.de === deAno && anosCarregados.ate === ateAno) {
			return;
		}

		let cancelado = false;

		pegarFeriadosIntervalo(deAno, ateAno)
			.then((lista) => {
				if (!cancelado) {
					feriados = lista;
					anosCarregados = { de: deAno, ate: ateAno };
				}
			})
			.catch(() => {
				if (!cancelado) {
					feriados = [];
					anosCarregados = { de: deAno, ate: ateAno };
				}
			});

		return () => {
			cancelado = true;
		};
	});

	$effect(() => {
		const deAtual = de.getTime();
		const ateAtual = ate.getTime();

		if (deAnterior === null || ateAnterior === null) {
			deAnterior = deAtual;
			ateAnterior = ateAtual;
			return;
		}

		const mudouDe = deAtual !== deAnterior;
		const mudouAte = ateAtual !== ateAnterior;

		deAnterior = deAtual;
		ateAnterior = ateAtual;

		if (!mudouDe && !mudouAte) {
			return;
		}

		const destino = mudouDe ? datePraPlainDate(de) : datePraPlainDate(ate);

		untrack(() => {
			anoVisivel = destino.year;
			mesVisivel = destino.month;
			selecaoPendente = null;
		});
	});

	function mesmoDia(a: Temporal.PlainDate, b: Temporal.PlainDate) {
		return Temporal.PlainDate.compare(a, b) === 0;
	}

	function nomesFeriado(dia: Temporal.PlainDate) {
		return feriadosPorData.get(dia.toString()) ?? [];
	}

	function noIntervalo(dia: Temporal.PlainDate) {
		return (
			Temporal.PlainDate.compare(dia, inicio) >= 0 && Temporal.PlainDate.compare(dia, fim) <= 0
		);
	}

	function ehInicio(dia: Temporal.PlainDate) {
		return mesmoDia(dia, inicio);
	}

	function ehFim(dia: Temporal.PlainDate) {
		return mesmoDia(dia, fim);
	}

	function ehHoje(dia: Temporal.PlainDate) {
		return mesmoDia(dia, hoje);
	}

	function ehFimDeSemana(dia: Temporal.PlainDate) {
		return dia.dayOfWeek >= 6;
	}

	function classeDia(dia: Temporal.PlainDate) {
		const base =
			'relative flex h-10 items-center justify-center rounded-md text-sm tabular-nums transition focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 focus-visible:outline-none dark:focus-visible:ring-offset-slate-900';
		const anelHoje = ehHoje(dia)
			? ' ring-2 ring-primary-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900'
			: '';

		if (selecaoPendente && mesmoDia(dia, selecaoPendente)) {
			return `${base} bg-sky-600 font-semibold text-white shadow-sm hover:bg-sky-700 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400${anelHoje}`;
		}

		if (ehInicio(dia) || ehFim(dia)) {
			return `${base} bg-primary-600 font-semibold text-white shadow-sm hover:bg-primary-700 dark:bg-primary-500 dark:text-slate-950 dark:hover:bg-primary-400${anelHoje}`;
		}

		if (!noIntervalo(dia)) {
			return `${base} text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-100${anelHoje}`;
		}

		if (nomesFeriado(dia).length > 0) {
			return `${base} bg-primary-50 text-rose-700 ring-1 ring-rose-200 hover:bg-primary-100 dark:bg-primary-900/25 dark:text-rose-200 dark:ring-rose-900 dark:hover:bg-primary-800/70 dark:hover:text-white dark:hover:ring-rose-600${anelHoje}`;
		}

		if (ehFimDeSemana(dia)) {
			return `${base} bg-primary-50 text-amber-700 hover:bg-primary-100 dark:bg-primary-900/25 dark:text-amber-200 dark:hover:bg-primary-800/70 dark:hover:text-white${anelHoje}`;
		}

		return `${base} bg-primary-50 text-primary-900 hover:bg-primary-100 dark:bg-primary-900/25 dark:text-primary-100 dark:hover:bg-primary-800/70 dark:hover:text-white${anelHoje}`;
	}

	function rotuloDia(dia: Temporal.PlainDate) {
		const partes = [formatadorData.format(plainDatePraDate(dia))];
		const nomes = nomesFeriado(dia);

		if (ehInicio(dia) && ehFim(dia)) {
			partes.push('início e fim do intervalo');
		} else if (ehInicio(dia)) {
			partes.push('início do intervalo');
		} else if (ehFim(dia)) {
			partes.push('fim do intervalo');
		} else if (noIntervalo(dia)) {
			partes.push('dentro do intervalo');
		} else {
			partes.push('fora do intervalo');
		}

		if (nomes.length > 0) {
			partes.push(`feriado: ${nomes.join(' e ')}`);
		} else if (ehFimDeSemana(dia)) {
			partes.push('fim de semana');
		} else {
			partes.push('dia útil');
		}

		if (ehHoje(dia)) {
			partes.push('hoje');
		}

		return partes.join(', ');
	}

	function mudarMes(delta: number) {
		const novoMes = new Temporal.PlainDate(anoVisivel, mesVisivel, 1).add({ months: delta });
		anoVisivel = novoMes.year;
		mesVisivel = novoMes.month;
	}

	function irPara(dia: Temporal.PlainDate) {
		anoVisivel = dia.year;
		mesVisivel = dia.month;
	}

	function cancelarSelecao() {
		selecaoPendente = null;
	}

	function selecionarDia(dia: Temporal.PlainDate) {
		diaFixado = diaFixado && mesmoDia(diaFixado, dia) ? null : dia;

		if (!ondefinir) {
			return;
		}

		if (!selecaoPendente) {
			selecaoPendente = dia;
			return;
		}

		const primeiro = Temporal.PlainDate.compare(selecaoPendente, dia) <= 0 ? selecaoPendente : dia;
		const ultimo = primeiro === selecaoPendente ? dia : selecaoPendente;

		selecaoPendente = null;
		ondefinir(plainDatePraDate(primeiro), plainDatePraDate(ultimo));
	}

	function aoTeclar(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			cancelarSelecao();
		}
	}
</script>

<svelte:window onkeydown={aoTeclar} />

<section
	class="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800"
	aria-labelledby="titulo-calendario"
>
	<div class="flex items-start justify-between gap-3">
		<div>
			<h3 id="titulo-calendario" class="flex items-center gap-2 text-sm font-semibold">
				<CalendarMonthSolid class="h-4 w-4 text-primary-600 dark:text-primary-300" />
				Calendário
			</h3>
			<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
				{#if aberto}
					{#if ondefinir}
						Clique em dois dias para definir um novo intervalo.
					{:else}
						Toque em um dia para ver os detalhes.
					{/if}
				{:else}
					Expanda para ver os dias e feriados.
				{/if}
			</p>
		</div>

		<div class="flex shrink-0 items-center gap-1">
			{#if onalternar}
				<button
					type="button"
					class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
					onclick={onalternar}
					aria-expanded={aberto}
					aria-controls="conteudo-calendario"
					aria-label={aberto ? 'Recolher calendário' : 'Expandir calendário'}
					title={aberto ? 'Recolher calendário' : 'Expandir calendário'}
				>
					<ChevronDownOutline class="h-4 w-4 transition-transform {aberto ? '' : '-rotate-90'}" />
				</button>
			{/if}
		</div>
	</div>

	<div id="conteudo-calendario" class={aberto ? '' : 'hidden'}>
		<div class="mt-4 flex items-center justify-between gap-2 px-8 sm:px-12 lg:px-0">
			<button
				type="button"
				class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none lg:order-2 lg:ml-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
				onclick={() => mudarMes(-1)}
				aria-label="Mês anterior"
				title="Mês anterior"
			>
				<ChevronLeftOutline class="h-4 w-4" />
			</button>

			<p class="text-sm font-semibold text-slate-700 capitalize lg:order-1 dark:text-slate-200">
				{rotuloMes}
			</p>

			<button
				type="button"
				class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none lg:order-3 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
				onclick={() => mudarMes(1)}
				aria-label="Próximo mês"
				title="Próximo mês"
			>
				<ChevronRightOutline class="h-4 w-4" />
			</button>
		</div>

		<div
			class="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500"
		>
			{#each DIAS_SEMANA as diaSemana (diaSemana)}
				<span class="py-1">{diaSemana}</span>
			{/each}
		</div>

		<div class="grid grid-cols-7 gap-1">
			{#each celulas as dia, indice (indice)}
				{#if dia}
					<button
						type="button"
						class={classeDia(dia)}
						onclick={() => selecionarDia(dia)}
						onmouseenter={() => (diaAtivo = dia)}
						onmouseleave={() => (diaAtivo = null)}
						onfocus={() => (diaAtivo = dia)}
						onblur={() => (diaAtivo = null)}
						aria-label={rotuloDia(dia)}
						aria-current={ehHoje(dia) ? 'date' : undefined}
					>
						<span>{dia.day}</span>
						{#if nomesFeriado(dia).length > 0}
							<span
								class="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500"
								aria-hidden="true"
							></span>
						{/if}
					</button>
				{:else}
					<div aria-hidden="true"></div>
				{/if}
			{/each}
		</div>

		<div class="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
			<button
				type="button"
				class="rounded text-slate-500 transition hover:text-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none dark:text-slate-400 dark:hover:text-primary-300"
				onclick={() => irPara(inicio)}
			>
				Ir ao início
			</button>
			<span class="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
			<button
				type="button"
				class="rounded text-slate-500 transition hover:text-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none dark:text-slate-400 dark:hover:text-primary-300"
				onclick={() => irPara(hoje)}
			>
				Hoje
			</button>
			<span class="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
			<button
				type="button"
				class="rounded text-slate-500 transition hover:text-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none dark:text-slate-400 dark:hover:text-primary-300"
				onclick={() => irPara(fim)}
			>
				Ir ao fim
			</button>
		</div>

		{#if selecaoPendente}
			<div
				class="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200"
			>
				<p>
					Data inicial selecionada:
					<strong class="font-semibold"
						>{formatadorDataCurta.format(plainDatePraDate(selecaoPendente))}</strong
					>
					. Escolha a data final.
				</p>
				<button
					type="button"
					class="rounded font-medium underline underline-offset-2 transition hover:text-sky-950 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:hover:text-white"
					onclick={cancelarSelecao}
				>
					Cancelar
				</button>
			</div>
		{/if}

		<div
			class="mt-3 flex min-h-20 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40"
			aria-live="polite"
		>
			<div
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-sm font-semibold text-slate-700 tabular-nums shadow-sm dark:bg-slate-800 dark:text-slate-200"
			>
				{diaDetalhe.day}
			</div>

			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium text-slate-900 capitalize dark:text-slate-100">
					{formatadorData.format(plainDatePraDate(diaDetalhe))}
				</p>

				<div class="mt-1.5 flex flex-wrap gap-1.5">
					{#if ehInicio(diaDetalhe) && ehFim(diaDetalhe)}
						<span
							class="rounded bg-primary-100 px-1.5 py-0.5 text-[11px] font-medium text-primary-800 dark:bg-primary-900/60 dark:text-primary-100"
						>
							Início e fim
						</span>
					{:else if ehInicio(diaDetalhe)}
						<span
							class="rounded bg-primary-100 px-1.5 py-0.5 text-[11px] font-medium text-primary-800 dark:bg-primary-900/60 dark:text-primary-100"
						>
							Início do intervalo
						</span>
					{:else if ehFim(diaDetalhe)}
						<span
							class="rounded bg-primary-100 px-1.5 py-0.5 text-[11px] font-medium text-primary-800 dark:bg-primary-900/60 dark:text-primary-100"
						>
							Fim do intervalo
						</span>
					{:else if noIntervalo(diaDetalhe)}
						<span
							class="rounded bg-primary-100 px-1.5 py-0.5 text-[11px] font-medium text-primary-800 dark:bg-primary-900/60 dark:text-primary-100"
						>
							Dentro do intervalo
						</span>
					{:else}
						<span
							class="rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
						>
							Fora do intervalo
						</span>
					{/if}

					{#if nomesFeriado(diaDetalhe).length > 0}
						<span
							class="rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-medium text-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
						>
							Feriado: {nomesFeriado(diaDetalhe).join(' e ')}
						</span>
					{:else if ehFimDeSemana(diaDetalhe)}
						<span
							class="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
						>
							Fim de semana
						</span>
					{:else}
						<span
							class="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
						>
							Dia útil
						</span>
					{/if}

					{#if ehHoje(diaDetalhe)}
						<span
							class="rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-medium text-sky-800 dark:bg-sky-950/50 dark:text-sky-200"
						>
							Hoje
						</span>
					{/if}
				</div>
			</div>
		</div>

		<div
			class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500 dark:text-slate-400"
		>
			<span class="flex items-center gap-1.5">
				<span class="h-2.5 w-2.5 rounded-sm bg-primary-600 dark:bg-primary-500"></span>
				Início/fim
			</span>
			<span class="flex items-center gap-1.5">
				<span class="h-2.5 w-2.5 rounded-sm bg-primary-100 dark:bg-primary-900/60"></span>
				No intervalo
			</span>
			<span class="flex items-center gap-1.5">
				<span class="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
				Feriado
			</span>
			<span class="flex items-center gap-1.5">
				<span class="h-2.5 w-2.5 rounded-sm border border-slate-300 dark:border-slate-600"></span>
				Hoje
			</span>
		</div>
	</div>
</section>
