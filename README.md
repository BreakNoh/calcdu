# calcdu

Uma API básica de calculadora de dias

## Endpoint de consulta

| Função                             | Endpoint                                                 |
| ---------------------------------- | -------------------------------------------------------- |
| Contar dias corridos entre 2 datas | /api/dias-corridos?de={dataAnterior}&ate={dataPosterior} |
| Contar dias úteis entre 2 datas    | /api/dias-uteis?de={dataAnterior}&ate={dataPosterior}    |
| Feriados entre 2 datas             | /api/feriados?de={dataAnterior}&ate={dataPosterior}      |
| Resumo de intervalo                | /api/feriados?de={dataAnterior}&ate={dataPosterior}      |

## Endpoint de cálculo

| Função                 | Endpoint                                                       |
| ---------------------- | -------------------------------------------------------------- |
| Adicionar dias em data | /api/adicionar?ref={data}&qnt={quantidade}&un={unidadeDeTempo} |
| Subtrair dias em data  | /api/subtrair?ref={data}&qnt={quantidade}&un={unidadeDeTempo}  |

## Unidades de tempo

| Identificador | Unidade       |
| ------------- | ------------- |
| d             | dia corrido   |
| b             | dia útil      |
| f             | fim de semana |
| w             | semana        |
| m             | mês           |
| y             | ano           |
| h             | feriado       |
