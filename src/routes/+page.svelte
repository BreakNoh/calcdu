<script lang="ts">
	import {
		ArrowRightOutline,
		CalendarMonthSolid,
		CheckOutline,
		ClipboardOutline,
		GithubSolid,
		InfoCircleOutline,
		LockOpenSolid,
		LockSolid,
		MoonSolid,
		SunSolid,
		UserCircleOutline
	} from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import { Datepicker, type ActionSlotParams } from 'flowbite-svelte';
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
	import { copiarTexto, datePraPlainDate, plainDatePraDate } from '#lib/util.ts';
	import Calendario from './Calendario.svelte';
	import Sumario from './Sumario.svelte';
	import { absoluteUrl, SITE } from '#lib/site.ts';

	const pageUrl = absoluteUrl('/');

	const structuredData = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': `${SITE.url}/#website`,
				url: `${SITE.url}/`,
				name: SITE.name,
				description: SITE.description,
				inLanguage: SITE.language,
				publisher: { '@id': `${SITE.url}/#organization` }
			},
			{
				'@type': 'Organization',
				'@id': `${SITE.url}/#organization`,
				name: SITE.name,
				url: `${SITE.url}/`,
				logo: {
					'@type': 'ImageObject',
					url: `${SITE.url}/icon-512.png`,
					width: 512,
					height: 512
				},
				founder: { '@type': 'Person', name: SITE.author, url: SITE.authorUrl },
				sameAs: [SITE.repoUrl, SITE.authorUrl]
			},
			{
				'@type': 'WebPage',
				'@id': `${SITE.url}/#webpage`,
				url: `${SITE.url}/`,
				name: SITE.title,
				description: SITE.description,
				isPartOf: { '@id': `${SITE.url}/#website` },
				inLanguage: SITE.language,
				about: { '@id': `${SITE.url}/#app` },
				primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE.url}/og-image.png` },
				datePublished: SITE.updatedAt,
				dateModified: SITE.updatedAt,
				breadcrumb: { '@id': `${SITE.url}/#breadcrumb` }
			},
			{
				'@type': 'SoftwareApplication',
				'@id': `${SITE.url}/#app`,
				name: 'Calculadora de Datas',
				applicationCategory: 'UtilitiesApplication',
				applicationSubCategory: 'Calculadora de datas e dias úteis',
				operatingSystem: 'Web',
				url: `${SITE.url}/`,
				description: SITE.description,
				inLanguage: SITE.language,
				isAccessibleForFree: true,
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
				featureList: [
					'Contagem de dias corridos entre duas datas',
					'Contagem de dias úteis sem feriados nacionais',
					'Cálculo de fins de semana e feriados no período',
					'Calendário interativo com seleção de intervalo',
					'Ajuste do intervalo a partir de dias corridos ou úteis'
				],
				publisher: { '@id': `${SITE.url}/#organization` }
			},
			{
				'@type': 'BreadcrumbList',
				'@id': `${SITE.url}/#breadcrumb`,
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE.url}/` }
				]
			}
		]
	};

	const structuredDataJson = JSON.stringify(structuredData).replace(/</g, '\\u003c');

	let deData = $state(new Date());
	let ateData = $state(new Date());

	let contagem = $state<ContagemDias>();
	let contagemFeriados = $state<ContagemFeriados>();

	let dataTravada = $state<'de' | 'ate' | null>(null);
	let ultimaAtualizacao = 0;

	let escuro = $state(false);
	let dataCopiada = $state<'de' | 'ate' | null>(null);
	let tempoDataCopiada: ReturnType<typeof setTimeout> | undefined;
	let datasCarregadas = $state(false);
	let calendarioAberto = $state(true);

	const CHAVE_DATAS = 'datas';

	onMount(() => {
		const salvo = localStorage.getItem('tema');
		escuro = salvo ? salvo === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;

		calendarioAberto = window.matchMedia('(min-width: 1024px)').matches;

		const datasSalvas = localStorage.getItem(CHAVE_DATAS);

		if (datasSalvas) {
			try {
				const { de, ate } = JSON.parse(datasSalvas) as { de?: string; ate?: string };
				const deSalva = de ? new Date(de) : null;
				const ateSalva = ate ? new Date(ate) : null;

				if (
					deSalva &&
					ateSalva &&
					!Number.isNaN(deSalva.getTime()) &&
					!Number.isNaN(ateSalva.getTime()) &&
					deSalva.getTime() <= ateSalva.getTime()
				) {
					deData = deSalva;
					ateData = ateSalva;
				}
			} catch {
				localStorage.removeItem(CHAVE_DATAS);
			}
		}

		datasCarregadas = true;
	});

	const travadaAte = $derived(dataTravada === 'ate');
	const dataReferencia = $derived(travadaAte ? ateData : deData);

	let focoInicialFeito = false;

	$effect(() => {
		document.documentElement.classList.toggle('dark', escuro);
	});

	$effect(() => {
		const de = deData.toISOString();
		const ate = ateData.toISOString();

		if (!datasCarregadas) {
			return;
		}

		try {
			localStorage.setItem(CHAVE_DATAS, JSON.stringify({ de, ate }));
		} catch {
			// Ignora falhas de armazenamento (ex.: modo privado ou cota cheia).
		}
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

	async function copiarData(qual: 'de' | 'ate', data: Date) {
		await copiarTexto(data.toLocaleDateString('pt-BR'));

		dataCopiada = qual;
		clearTimeout(tempoDataCopiada);
		tempoDataCopiada = setTimeout(() => {
			dataCopiada = null;
		}, 2000);
	}

	function alternarTrava(data: 'de' | 'ate') {
		dataTravada = dataTravada === data ? null : data;
		ultimaAtualizacao += 1;
	}

	function selecionarHoje(qual: 'de' | 'ate') {
		const agora = new Date();
		const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

		if (qual === 'de') {
			deData = hoje;

			if (hoje.getTime() > ateData.getTime()) {
				ateData = hoje;
			}
		} else {
			if (hoje.getTime() < deData.getTime()) {
				return;
			}

			ateData = hoje;
		}

		ultimaAtualizacao += 1;
	}

	function ajustarDataInicial(data: Date) {
		if (data.getTime() > ateData.getTime()) {
			ateData = data;
			ultimaAtualizacao += 1;
		}
	}

	function podeSelecionarHoje(qual: 'de' | 'ate') {
		if (qual === 'de') {
			return true;
		}

		const agora = new Date();
		const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

		return hoje.getTime() >= deData.getTime();
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

{#snippet AcaoHojeInicial({ close }: ActionSlotParams)}
	<button
		type="button"
		class="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 transition hover:bg-primary-100 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-primary-800 dark:bg-primary-900/25 dark:text-primary-200 dark:hover:bg-primary-900/40 dark:focus-visible:ring-offset-slate-700 dark:disabled:border-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
		onclick={() => {
			selecionarHoje('de');
			close();
		}}
		disabled={!podeSelecionarHoje('de')}
		title={podeSelecionarHoje('de') ? 'Selecionar hoje' : 'Hoje está fora do intervalo permitido'}
	>
		<CalendarMonthSolid class="h-4 w-4" aria-hidden="true" />
		Selecionar hoje
	</button>
{/snippet}

{#snippet AcaoHojeFinal({ close }: ActionSlotParams)}
	<button
		type="button"
		class="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 transition hover:bg-primary-100 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-primary-800 dark:bg-primary-900/25 dark:text-primary-200 dark:hover:bg-primary-900/40 dark:focus-visible:ring-offset-slate-700 dark:disabled:border-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
		onclick={() => {
			selecionarHoje('ate');
			close();
		}}
		disabled={!podeSelecionarHoje('ate')}
		title={podeSelecionarHoje('ate') ? 'Selecionar hoje' : 'Hoje está fora do intervalo permitido'}
	>
		<CalendarMonthSolid class="h-4 w-4" aria-hidden="true" />
		Selecionar hoje
	</button>
{/snippet}

<svelte:head>
	<title>{SITE.title}</title>
	<meta name="description" content={SITE.description} />
	<meta name="author" content={SITE.author} />
	<meta
		name="robots"
		content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
	/>
	<link rel="canonical" href={pageUrl} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:locale" content={SITE.locale} />
	<meta property="og:title" content={SITE.title} />
	<meta property="og:description" content={SITE.description} />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:image" content={`${SITE.url}/og-image.png`} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta
		property="og:image:alt"
		content="Calculadora de Datas: dias corridos, dias úteis, fins de semana e feriados."
	/>

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={SITE.title} />
	<meta name="twitter:description" content={SITE.description} />
	<meta name="twitter:image" content={`${SITE.url}/og-image.png`} />

	{@html `<script type="application/ld+json">${structuredDataJson}</script>`}
</svelte:head>

<div
	class="min-h-dvh bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
>
	<div class="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:py-12">
		<a
			href="#conteudo"
			class="sr-only rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 dark:bg-slate-900 dark:text-white"
		>
			Pular para o conteúdo
		</a>

		<header class="flex items-start justify-between gap-4">
			<div class="flex items-start gap-4">
				<div class="flex h-12 w-12 shrink-0 items-center justify-center" aria-hidden="true">
					<img
						src="/calcdu_logo.svg"
						alt=""
						width="48"
						height="48"
						class="h-12 w-12 rounded-xl"
						decoding="async"
					/>
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
				class="relative z-20 rounded-xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6 dark:border-slate-800 dark:bg-slate-900/80"
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

							<div class="flex items-center gap-1">
								<button
									type="button"
									class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white dark:focus-visible:ring-offset-slate-900"
									onclick={() => copiarData('de', deData)}
									aria-label="Copiar data inicial"
									title={dataCopiada === 'de' ? 'Copiado!' : 'Copiar data inicial'}
								>
									{#if dataCopiada === 'de'}
										<CheckOutline class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
									{:else}
										<ClipboardOutline class="h-5 w-5" />
									{/if}
								</button>

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
						</div>

						<Datepicker
							bind:value={deData}
							disabled={dataTravada === 'de'}
							locale="pt-BR"
							dateFormat={{ day: '2-digit', month: '2-digit', year: 'numeric' }}
							placeholder="Selecione a data"
							actionSlot={AcaoHojeInicial}
							onselect={(data) => {
								if (data instanceof Date) {
									ajustarDataInicial(data);
								}
							}}
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
						<ArrowRightOutline
							class="h-5 w-5 transition-transform {dataTravada === 'ate'
								? '-rotate-90 md:rotate-180'
								: 'rotate-90 md:rotate-0'}"
							aria-hidden="true"
						/>
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

							<div class="flex items-center gap-1">
								<button
									type="button"
									class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white dark:focus-visible:ring-offset-slate-900"
									onclick={() => copiarData('ate', ateData)}
									aria-label="Copiar data final"
									title={dataCopiada === 'ate' ? 'Copiado!' : 'Copiar data final'}
								>
									{#if dataCopiada === 'ate'}
										<CheckOutline class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
									{:else}
										<ClipboardOutline class="h-5 w-5" />
									{/if}
								</button>

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
						</div>

						<Datepicker
							bind:value={ateData}
							availableFrom={deData}
							disabled={dataTravada === 'ate'}
							locale="pt-BR"
							dateFormat={{ day: '2-digit', month: '2-digit', year: 'numeric' }}
							placeholder="Selecione a data"
							actionSlot={AcaoHojeFinal}
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

				<div class="mt-4 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
					<InfoCircleOutline class="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
					<p>
						{#if dataTravada === 'ate'}
							Os valores do resumo são contados a partir da <strong
								class="font-medium text-slate-700 dark:text-slate-300">data final</strong
							>, voltando no tempo e atualizando a data inicial.
						{:else if dataTravada === 'de'}
							Os valores do resumo são contados a partir da <strong
								class="font-medium text-slate-700 dark:text-slate-300">data inicial</strong
							>, avançando no tempo e atualizando a data final.
						{:else}
							Nenhuma data está travada, então a <strong
								class="font-medium text-slate-700 dark:text-slate-300">data inicial</strong
							>
							é usada como referência padrão. Use o cadeado ao lado de uma data para fixá-la.
						{/if}
					</p>
				</div>

				<Calendario
					de={deData}
					ate={ateData}
					ondefinir={definirIntervalo}
					aberto={calendarioAberto}
					onalternar={() => (calendarioAberto = !calendarioAberto)}
				/>
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

			<section
				id="conteudo"
				class="mt-6 border-t border-slate-200 pt-8 lg:col-span-2 dark:border-slate-800"
				aria-labelledby="titulo-conteudo"
			>
				<div class="mx-auto max-w-3xl">
					<h2 id="titulo-conteudo" class="text-2xl font-semibold tracking-tight">
						Como contar dias entre duas datas
					</h2>

					<p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						Esta ferramenta conta quantos dias existem entre duas datas e separa o resultado em dias
						corridos, dias úteis, fins de semana e feriados. Escolha a data inicial e a data final
						nos campos acima: o resumo é recalculado na hora, sem botão de confirmar. Também é
						possível editar um dos números do resumo para descobrir a data correspondente, o que
						ajuda quando o prazo é informado em dias úteis.
					</p>

					<p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						A contagem usada aqui é <strong class="font-semibold text-slate-900 dark:text-white"
							>inclusiva</strong
						>: a data inicial e a data final fazem parte do intervalo. Entre 1º e 10 de janeiro, por
						exemplo, existem 10 dias, e não 9. Esse critério é comum em contratos, prazos de entrega
						e planejamento de férias, mas nem toda regra de contagem adota o mesmo padrão. Em prazos
						legais, confirme se o dia do início entra ou não na conta.
					</p>

					<p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						Os campos podem ser travados com o ícone de cadeado. Ao travar a data inicial, ela vira
						a referência do cálculo e qualquer mudança no resumo recalcula a data final. Ao travar a
						data final, o caminho é inverso: a ferramenta volta no tempo para encontrar a data de
						partida. O calendário abaixo dos campos também aceita dois cliques para definir um novo
						intervalo.
					</p>

					<nav aria-label="Nesta página" class="mt-5 flex flex-wrap gap-2 text-xs">
						<a
							href="#dias-corridos"
							class="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-700 dark:hover:text-primary-200"
						>
							Dias corridos x dias úteis
						</a>
						<a
							href="#feriados"
							class="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-700 dark:hover:text-primary-200"
						>
							Feriados no cálculo
						</a>
						<a
							href="#exemplos"
							class="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-700 dark:hover:text-primary-200"
						>
							Exemplos práticos
						</a>
						<a
							href="#prazos"
							class="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-700 dark:hover:text-primary-200"
						>
							Prazos e cuidados
						</a>
						<a
							href="#faq"
							class="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-700 dark:hover:text-primary-200"
						>
							Perguntas frequentes
						</a>
					</nav>

					<h2 id="dias-corridos" class="mt-10 text-2xl font-semibold tracking-tight">
						Dias corridos e dias úteis: qual é a diferença?
					</h2>

					<p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						Dia corrido é qualquer dia do calendário, incluindo sábados, domingos e feriados. É a
						unidade usada em prazos de validade, contratos, aluguel e contagem de idade. Dia útil,
						por sua vez, é o dia de trabalho: de segunda a sexta-feira, excluindo os feriados
						nacionais que caem nesses dias. Bancos, comércio e órgãos públicos podem ter regras
						próprias, mas a base usada aqui é a do calendário civil brasileiro.
					</p>

					<div class="mt-4 overflow-x-auto">
						<table class="w-full min-w-[560px] border-collapse text-left text-sm">
							<thead>
								<tr class="border-b border-slate-200 dark:border-slate-700">
									<th scope="col" class="py-2 pr-4 font-semibold text-slate-900 dark:text-slate-100"
										>Contagem</th
									>
									<th scope="col" class="py-2 pr-4 font-semibold text-slate-900 dark:text-slate-100"
										>O que inclui</th
									>
									<th scope="col" class="py-2 font-semibold text-slate-900 dark:text-slate-100"
										>Uso típico</th
									>
								</tr>
							</thead>
							<tbody class="text-slate-600 dark:text-slate-300">
								<tr class="border-b border-slate-100 dark:border-slate-800">
									<th scope="row" class="py-2 pr-4 font-medium text-slate-900 dark:text-slate-100"
										>Dias corridos</th
									>
									<td class="py-2 pr-4">Todos os dias, inclusive fins de semana e feriados</td>
									<td class="py-2">Validade, contratos, aluguel, idade</td>
								</tr>
								<tr class="border-b border-slate-100 dark:border-slate-800">
									<th scope="row" class="py-2 pr-4 font-medium text-slate-900 dark:text-slate-100"
										>Dias úteis</th
									>
									<td class="py-2 pr-4">Segunda a sexta, sem feriados nacionais</td>
									<td class="py-2">Entregas, SLAs, prazos de trabalho</td>
								</tr>
								<tr class="border-b border-slate-100 dark:border-slate-800">
									<th scope="row" class="py-2 pr-4 font-medium text-slate-900 dark:text-slate-100"
										>Fim de semana</th
									>
									<td class="py-2 pr-4">Sábados e domingos do intervalo</td>
									<td class="py-2">Escalas, plantões e folgas</td>
								</tr>
								<tr>
									<th scope="row" class="py-2 pr-4 font-medium text-slate-900 dark:text-slate-100"
										>Feriados</th
									>
									<td class="py-2 pr-4">Feriados nacionais dentro do período</td>
									<td class="py-2">Conferência e planejamento</td>
								</tr>
							</tbody>
						</table>
					</div>

					<p class="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						Em novembro de 2026, o intervalo de 1º a 30 tem 30 dias corridos, 21 dias de segunda a
						sexta e 9 dias de fim de semana. Como o dia 2 (Finados) e o dia 20 (Consciência Negra)
						caem em dias de semana, o total de dias úteis fica em 19. O dia 15 (Proclamação da
						República) cai em um domingo e, por isso, não reduz ainda mais a conta. Esse tipo de
						conferência evita erros em prazos apertados e mostra por que os dois números podem ser
						tão diferentes.
					</p>

					<h2 id="feriados" class="mt-10 text-2xl font-semibold tracking-tight">
						Como os feriados entram no cálculo de dias úteis
					</h2>

					<p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						O cálculo de dias úteis é feito em duas etapas. Primeiro, a ferramenta percorre o
						intervalo e remove sábados e domingos. Depois, desconta os feriados nacionais que caem
						em dias de semana. Um feriado em um sábado ou domingo não altera o total de dias úteis,
						porque aquele dia já estava fora da conta. Já um feriado em uma terça-feira reduz o
						resultado em um dia.
					</p>

					<p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						Existem dois grupos de feriados nacionais. As datas fixas acontecem todos os anos no
						mesmo dia, como 1º de janeiro, 21 de abril, 7 de setembro e 25 de dezembro. As datas
						móveis dependem da Páscoa, que por sua vez segue o calendário lunar: Carnaval,
						Sexta-feira Santa e Corpus Christi mudam de data a cada ano. Por isso o número de dias
						úteis de um mesmo mês pode variar de um ano para outro.
					</p>

					<p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						A lista de feriados é buscada na
						<a
							href="https://brasilapi.com.br"
							target="_blank"
							rel="noopener noreferrer"
							class="font-medium text-primary-800 underline underline-offset-2 hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-200"
						>
							BrasilAPI</a
						>
						e fica em cache no navegador para não ser baixada a cada consulta. Em 2026, a base retorna
						14 datas, incluindo Carnaval (segunda e terça) e Páscoa. Algumas dessas datas são tratadas
						como ponto facultativo em parte do país, e o calendário da API pode mudar se houver alteração
						na legislação.
					</p>

					<p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						A ferramenta considera apenas feriados <strong
							class="font-semibold text-slate-900 dark:text-white">nacionais</strong
						>. Feriados estaduais, municipais e datas comemorativas sem status de feriado não entram
						na contagem. Se o seu prazo depende do calendário local, confira também a portaria ou o
						decreto do órgão responsável.
					</p>

					<h2 id="exemplos" class="mt-10 text-2xl font-semibold tracking-tight">
						Exemplos práticos de contagem de datas
					</h2>

					<ul
						class="mt-3 list-disc space-y-3 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
					>
						<li>
							<strong class="font-semibold text-slate-900 dark:text-white"
								>Quinze dias úteis a partir de 1º de dezembro de 2026</strong
							>: contando 1º de dezembro como o primeiro dia útil, o prazo termina em 21 de dezembro
							de 2026. O Natal fica fora do intervalo e não altera a conta.
						</li>
						<li>
							<strong class="font-semibold text-slate-900 dark:text-white"
								>Trinta dias corridos de férias a partir de 5 de janeiro de 2026</strong
							>: como o dia inicial entra na conta, o último dia é 3 de fevereiro de 2026.
						</li>
						<li>
							<strong class="font-semibold text-slate-900 dark:text-white"
								>Noventa dias corridos a partir de 1º de março de 2026</strong
							>: o intervalo termina em 29 de maio de 2026, somando os 31 dias de março, os 30 de
							abril e os 29 dias necessários em maio.
						</li>
					</ul>

					<p class="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						Para saber quantos dias faltam para uma data, use o dia de hoje como data inicial e a
						data desejada como data final. O resumo mostra a contagem inclusiva. Se você precisa da
						diferença entre as datas sem contar hoje, subtraia 1 do total de dias corridos — o mesmo
						vale para outras regras que excluem o dia inicial.
					</p>

					<h2 id="prazos" class="mt-10 text-2xl font-semibold tracking-tight">
						Contagem inclusiva, prazos e cuidados
					</h2>

					<p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						A diferença entre duas datas pode ser calculada de duas formas. Na contagem exclusiva,
						basta subtrair a data inicial da data final: de 1º a 10 de janeiro são 9 dias. Na
						contagem inclusiva, soma-se 1 ao resultado, porque o dia inicial também conta: 10 dias.
						Nenhuma das duas está errada — o importante é usar o critério que a regra do seu prazo
						exige.
					</p>

					<p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						Prazos contratuais, entregas e planejamento interno costumam usar dias corridos ou úteis
						conforme a área responsável. Já prazos processuais e administrativos têm regras
						próprias, que podem excluir o dia do começo, considerar apenas dias úteis, prever
						suspensões e recessos ou depender do tribunal. Esta ferramenta é uma referência de
						calendário e não substitui a orientação jurídica nem a contagem oficial do órgão.
					</p>

					<p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						As datas são tratadas como dias locais, sem conversão para UTC. Isso evita o erro
						clássico de um dia a menos em fusos negativos, comum quando uma data é convertida para
						meia-noite universal. O cálculo também não depende de horário: 1º de janeiro é sempre 1º
						de janeiro, independentemente da hora do dia.
					</p>

					<h2 id="faq" class="mt-10 text-2xl font-semibold tracking-tight">Perguntas frequentes</h2>

					<div class="mt-4 space-y-3">
						<details
							class="rounded-lg border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
						>
							<summary
								class="cursor-pointer list-none text-sm font-medium text-slate-900 dark:text-slate-100"
							>
								A contagem inclui o dia inicial e o dia final?
							</summary>
							<p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
								Sim. A contagem é inclusiva: as duas pontas entram no intervalo. Por isso, de 1º a
								10 de janeiro o resultado é 10 dias. Se a sua regra exclui o dia inicial, subtraia 1
								do total.
							</p>
						</details>

						<details
							class="rounded-lg border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
						>
							<summary
								class="cursor-pointer list-none text-sm font-medium text-slate-900 dark:text-slate-100"
							>
								Feriados estaduais e municipais são considerados?
							</summary>
							<p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
								Não. Apenas os feriados nacionais retornados pela BrasilAPI entram no desconto dos
								dias úteis. Feriados estaduais, municipais e pontos facultativos locais precisam ser
								conferidos separadamente.
							</p>
						</details>

						<details
							class="rounded-lg border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
						>
							<summary
								class="cursor-pointer list-none text-sm font-medium text-slate-900 dark:text-slate-100"
							>
								Um feriado no sábado ou domingo reduz os dias úteis?
							</summary>
							<p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
								Não. Sábados e domingos já são excluídos antes do desconto dos feriados. Um feriado
								que cai no fim de semana aparece na lista de feriados do período, mas não diminui o
								total de dias úteis.
							</p>
						</details>

						<details
							class="rounded-lg border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
						>
							<summary
								class="cursor-pointer list-none text-sm font-medium text-slate-900 dark:text-slate-100"
							>
								Como saber quantos dias faltam para o Natal?
							</summary>
							<p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
								Use a data de hoje como data inicial e 25 de dezembro como data final. A linha
								“Dias” mostra a contagem inclusiva. Se quiser a diferença sem contar hoje, subtraia
								1 do valor exibido.
							</p>
						</details>

						<details
							class="rounded-lg border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
						>
							<summary
								class="cursor-pointer list-none text-sm font-medium text-slate-900 dark:text-slate-100"
							>
								A ferramenta serve para prazos legais e judiciais?
							</summary>
							<p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
								Ela serve como referência de calendário, mas prazos legais podem ter regras
								específicas de contagem, suspensões e recessos. Para esses casos, confirme o cálculo
								com o tribunal, o órgão competente ou um profissional jurídico.
							</p>
						</details>

						<details
							class="rounded-lg border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
						>
							<summary
								class="cursor-pointer list-none text-sm font-medium text-slate-900 dark:text-slate-100"
							>
								Por que o número de feriados muda de um ano para outro?
							</summary>
							<p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
								Porque parte dos feriados é móvel. Carnaval, Sexta-feira Santa e Corpus Christi
								dependem da data da Páscoa, que muda todos os anos. Além disso, novas leis podem
								criar ou alterar feriados nacionais.
							</p>
						</details>
					</div>

					<h2 id="sobre" class="mt-10 text-2xl font-semibold tracking-tight">
						Sobre a ferramenta e os dados
					</h2>

					<p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						O Calcdu é uma ferramenta gratuita e sem cadastro, mantida por
						<a
							href="https://bre.dev.br"
							target="_blank"
							rel="noopener noreferrer"
							class="font-medium text-primary-800 underline underline-offset-2 hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-200"
						>
							Breno Meneses</a
						>. O código-fonte está disponível no
						<a
							href="https://github.com/breaknoh/calcdu"
							target="_blank"
							rel="noopener noreferrer"
							class="font-medium text-primary-800 underline underline-offset-2 hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-200"
						>
							GitHub</a
						>, e os feriados vêm da BrasilAPI. O cálculo roda no navegador e as datas escolhidas
						ficam salvas apenas no seu dispositivo. Conteúdo publicado em novembro de 2026.
					</p>
				</div>
			</section>
		</main>

		<footer
			class="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:text-slate-400"
		>
			<div class="space-y-1">
				<p>Contagem inclusiva: a data inicial e a data final fazem parte do intervalo.</p>
				<p>
					Fonte dos feriados:
					<a
						href="https://brasilapi.com.br"
						target="_blank"
						rel="noopener noreferrer"
						class="rounded-sm font-medium underline-offset-2 transition hover:text-slate-900 hover:underline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none dark:hover:text-white"
					>
						BrasilAPI
					</a>
				</p>
			</div>

			<nav class="flex items-center gap-4" aria-label="Links do autor">
				<a
					href="https://github.com/breaknoh"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1.5 rounded-md transition hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none dark:hover:text-white"
				>
					<GithubSolid class="h-4 w-4" />
					BreakNoh
				</a>
				<a
					href="https://bre.dev.br"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1.5 rounded-md transition hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none dark:hover:text-white"
				>
					<UserCircleOutline class="h-4 w-4" />
					feito por Breno Meneses
				</a>
			</nav>
		</footer>
	</div>
</div>
