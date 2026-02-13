# Sistema de Cálculo de Puntuaciones - Rugby Stats

Este documento describe en detalle cómo se calculan las puntuaciones de los jugadores en el sistema Rugby Stats.

---

## Índice

1. [Introducción](#introducción)
2. [Tipos de Puntuación](#tipos-de-puntuación)
3. [Fórmulas de Cálculo](#fórmulas-de-cálculo)
4. [Sistema de Pesos](#sistema-de-pesos)
5. [Normalización y Control de Inflación](#normalización-y-control-de-inflación)
6. [Constantes del Sistema](#constantes-del-sistema)
7. [Rankings](#rankings)
8. [Ejemplos Prácticos](#ejemplos-prácticos)
9. [Configuración de Pesos](#configuración-de-pesos)

---

## Introducción

El sistema de puntuación de Rugby Stats evalúa el rendimiento de cada jugador en cada partido mediante un algoritmo que:

1. **Pondera las estadísticas** según la posición exacta del jugador (1-15), con pesos individuales por puesto
2. **Normaliza el tiempo de juego** para comparar jugadores con diferentes minutos en cancha
3. **Previene la inflación de puntuaciones** en jugadores con poco tiempo de juego

El objetivo es generar puntuaciones justas y comparables que reflejen el impacto real de cada jugador en el partido.

---

## Tipos de Puntuación

El sistema calcula **dos tipos de puntuación** para cada jugador por partido:

### 1. Score Absoluto (`score_absoluto`)

Es la suma ponderada de todas las estadísticas del jugador en el partido. Representa el rendimiento "bruto" sin considerar el tiempo jugado.

**Características:**
- Se calcula sumando cada estadística multiplicada por su peso correspondiente
- Los pesos son específicos para cada posición (1-15), no simplemente forwards vs backs
- Puede ser positivo o negativo dependiendo del balance entre acciones positivas y errores
- No considera el tiempo de juego

### 2. Puntuación Final (`puntuacion_final`)

Es el score normalizado a 70 minutos de juego. Permite comparar jugadores que jugaron diferentes cantidades de tiempo.

**Características:**
- Proyecta el rendimiento del jugador a un partido completo de 70 minutos
- Incluye un mecanismo de control para evitar puntuaciones infladas
- Es la métrica principal usada para rankings y comparaciones

---

## Fórmulas de Cálculo

### Paso 1: Cálculo del Score Absoluto

```
score_absoluto = Σ (estadística × peso_para_posición)
```

Donde:
- **Σ** = Sumatoria de todas las estadísticas
- **estadística** = Valor numérico de cada acción (tackles, pases, etc.)
- **peso_para_posición** = Multiplicador específico de la posición del jugador (1-15)

**Ejemplo (Puesto 7 - Ala):**
```
tackles_positivos: 5  ×  peso_pos_7: 6.5  =  32.5
tackles_errados: 2    ×  peso_pos_7: -5.0 =  -10.0
ruck_ofensivos: 8     ×  peso_pos_7: 2.5  =  20.0
                                           -------
                             score_absoluto = 42.5
```

### Paso 2: Cálculo del Tiempo Efectivo

```
tiempo_efectivo = max(tiempo_juego, 40)
```

Se aplica un **piso de 40 minutos** para evitar que jugadores con poco tiempo de juego obtengan puntuaciones artificialmente altas.

### Paso 3: Cálculo de la Puntuación Final

```
puntuacion_final = (score_absoluto / tiempo_efectivo) × 70
```

Esta fórmula proyecta el rendimiento a un partido completo de 70 minutos.

---

## Sistema de Pesos

Los pesos determinan cuánto impacta cada estadística en la puntuación final. Cada posición (1-15) tiene un peso individual para cada una de las 16 estadísticas, almacenados en la tabla `scoring_weights` como una fila por `(config_id, action_name, position)`.

### Posiciones

| Puesto | Posición | Grupo |
|:------:|----------|-------|
| 1 | Pilar Izquierdo | Pilares |
| 2 | Hooker | Hooker |
| 3 | Pilar Derecho | Pilares |
| 4 | 2da Línea | 2da Línea |
| 5 | 2da Línea | 2da Línea |
| 6 | Ala (Flanker) | Tercera Línea |
| 7 | Ala (Flanker) | Tercera Línea |
| 8 | N°8 | Tercera Línea |
| 9 | Medio Scrum | Medios |
| 10 | Apertura | Medios |
| 11 | Wing | Back 3 |
| 12 | Centro Interior | Centros |
| 13 | Centro Exterior | Centros |
| 14 | Wing | Back 3 |
| 15 | Fullback | Back 3 |

### Pesos por Defecto

Los pesos por defecto están definidos en `backend/app/constants.py` (`DEFAULT_SCORING_WEIGHTS`). Cada celda muestra el peso para esa posición. En **negrita** los valores más altos (positivos) o más bajos (negativos) de cada fila.

#### Acciones Positivas

| Estadística | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tackles_positivos | 4.5 | 4.5 | 4.5 | 5.0 | 5.0 | 5.5 | **6.5** | 5.0 | 3.5 | 3.0 | 2.5 | 4.0 | 3.5 | 2.5 | 3.0 |
| tackles | 2.0 | 2.0 | 2.0 | 2.0 | 2.0 | 2.5 | **3.0** | 2.5 | 1.5 | 1.5 | 1.0 | 2.0 | 1.8 | 1.0 | 1.5 |
| portador | 1.5 | 1.5 | 1.5 | 1.5 | 1.5 | 2.0 | 2.0 | **2.5** | 1.0 | 1.5 | 2.0 | 2.0 | 2.0 | 2.0 | 1.5 |
| ruck_ofensivos | **3.0** | 2.5 | **3.0** | **3.0** | **3.0** | 2.5 | 2.5 | 2.5 | 0.5 | 0.5 | 0.5 | 1.0 | 0.5 | 0.5 | 0.5 |
| pases | 0.3 | 0.5 | 0.3 | 0.3 | 0.3 | 0.5 | 0.5 | 0.8 | **2.0** | 1.8 | 1.0 | 1.2 | 1.2 | 1.0 | 1.0 |
| recuperaciones | 4.5 | 5.0 | 4.5 | 5.0 | 5.0 | 5.5 | **6.5** | 5.5 | 4.0 | 3.5 | 3.5 | 4.0 | 4.0 | 3.5 | 4.0 |
| gana_contacto | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 3.5 | 3.5 | 4.0 | 3.0 | 3.5 | 4.0 | **4.5** | **4.5** | 4.0 | 3.5 |
| quiebres | 3.0 | 3.5 | 3.0 | 3.5 | 3.5 | 4.5 | 4.5 | 5.0 | 5.5 | 6.0 | **7.5** | 6.5 | 7.0 | **7.5** | 6.0 |
| juego_pie | 0.5 | 0.5 | 0.5 | 0.5 | 0.5 | 0.8 | 0.8 | 1.5 | 2.5 | **4.0** | 2.0 | 2.0 | 2.0 | 2.0 | 3.5 |
| recepcion_aire_buena | 2.0 | 2.5 | 2.0 | 4.0 | 4.0 | 3.0 | 3.0 | 3.5 | 3.0 | 4.0 | 4.5 | 3.5 | 3.5 | 4.5 | **5.5** |
| try_ | 8.0 | 8.5 | 8.0 | 9.0 | 9.0 | 9.5 | 10.0 | 10.0 | 10.0 | 10.5 | **12.0** | 11.0 | 11.0 | **12.0** | 10.5 |

#### Acciones Negativas

| Estadística | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tackles_errados | -3.5 | -3.5 | -3.5 | -4.0 | -4.0 | -4.5 | **-5.0** | -4.0 | -3.0 | -3.0 | -2.5 | -3.5 | -3.0 | -2.5 | -3.0 |
| pases_malos | -1.5 | -2.0 | -1.5 | -1.5 | -1.5 | -2.0 | -2.0 | -2.5 | **-5.0** | -4.5 | -3.5 | -4.0 | -4.0 | -3.5 | -3.5 |
| perdidas | -3.5 | -3.5 | -3.5 | -4.0 | -4.0 | -4.0 | -4.0 | -4.5 | -4.5 | **-5.0** | **-5.0** | **-5.0** | **-5.0** | **-5.0** | -4.5 |
| penales | **-5.5** | -5.0 | **-5.5** | -5.0 | -5.0 | -5.0 | **-6.0** | -5.0 | -4.0 | -4.0 | -3.5 | -4.0 | -4.0 | -3.5 | -4.0 |
| recepcion_aire_mala | -2.0 | -2.5 | -2.0 | -3.5 | -3.5 | -3.0 | -3.0 | -3.0 | -3.0 | -3.5 | -4.0 | -3.5 | -3.5 | -4.0 | **-5.0** |

### Filosofía de los Pesos

Los pesos reflejan las demandas específicas de cada posición:

- **Pilares (1, 3)**: Alto peso en rucks ofensivos y trabajo físico. Penalización fuerte por infracciones (penales -5.5).
- **Hooker (2)**: Similar a pilares pero con mayor peso en distribución y recuperaciones.
- **2da Línea (4, 5)**: Valoran tackles positivos, recepción aérea y trabajo de ruck. Son la referencia en el juego aéreo.
- **Tercera Línea (6, 7, 8)**: Los pesos más altos en tackles positivos (7: 6.5) y recuperaciones (7: 6.5). Los más dinámicos del pack.
- **Medios (9, 10)**: Dominan en pases y juego al pie. Penalización severa por pases malos (9: -5.0). La apertura (10) tiene el peso más alto en juego_pie (4.0).
- **Centros (12, 13)**: Alto peso en gana_contacto (4.5) y quiebres. Combinan choque con distribución.
- **Back 3 (11, 14, 15)**: Máximo peso en quiebres (7.5), tries (12.0) y recepción aérea. El fullback (15) tiene el mayor peso en recepcion_aire_buena (5.5).

---

## Normalización y Control de Inflación

### El Problema de la Inflación

Sin control, un jugador que juega pocos minutos puede obtener puntuaciones exageradas:

**Ejemplo sin piso de normalización:**
```
Jugador: Suplente que entró 10 minutos
Estadísticas: 2 tackles positivos (puesto 7)

score_absoluto = 2 × 6.5 = 13
puntuacion_final = (13 / 10) × 70 = 91  ← ¡Puntuación inflada!
```

### La Solución: Piso de Normalización

Se establece un **piso mínimo de 40 minutos** para el cálculo:

**Ejemplo con piso de normalización:**
```
Jugador: Suplente que entró 10 minutos
Estadísticas: 2 tackles positivos (puesto 7)

score_absoluto = 2 × 6.5 = 13
tiempo_efectivo = max(10, 40) = 40  ← Se aplica el piso
puntuacion_final = (13 / 40) × 70 = 22.75  ← Puntuación realista
```

### Comportamiento por Tiempo de Juego

| Tiempo Jugado | Tiempo Efectivo | Efecto |
|:-------------:|:---------------:|--------|
| 10 min | 40 min | Fuerte penalización |
| 30 min | 40 min | Penalización moderada |
| 40 min | 40 min | Sin ajuste (punto de equilibrio) |
| 60 min | 60 min | Sin ajuste |
| 70 min | 70 min | Sin ajuste (partido completo) |

---

## Constantes del Sistema

El sistema utiliza tres constantes fundamentales definidas en el código:

| Constante | Valor | Uso |
|-----------|:-----:|-----|
| `STANDARD_MATCH_DURATION` | **70 min** | Duración del partido para el caso de uso actual. Se usa como base para la normalización. |
| `MIN_MINUTES_FOR_NORMALIZATION` | **40 min** | Piso para el cálculo de puntuación. Previene inflación en jugadores con poco tiempo. |
| `MIN_MINUTES_FOR_RANKING` | **20 min** | Mínimo de minutos para aparecer en rankings agregados. Filtra apariciones muy cortas. |

### Ubicación en el Código

```python
# backend/app/services/scoring.py

STANDARD_MATCH_DURATION = 70
MIN_MINUTES_FOR_RANKING = 20
MIN_MINUTES_FOR_NORMALIZATION = 40
```

---

## Rankings

El sistema ofrece dos vistas de rankings:

### 1. Rankings por Partido Individual

Cuando se selecciona un partido específico:

- Muestra todos los jugadores del partido
- Ordenados por `puntuacion_final` de mayor a menor
- **No aplica** filtro de minutos mínimos por defecto
- Incluye: rival, puesto, tiempo de juego, score absoluto, puntuación final

**Uso:** Analizar el rendimiento de cada jugador en un partido específico.

### 2. Rankings Agregados (Todos los Partidos)

Cuando no se filtra por partido:

- Calcula el **promedio** de `puntuacion_final` de cada jugador
- **Solo incluye** actuaciones con ≥20 minutos de juego
- Evita que apariciones muy cortas distorsionen el promedio
- Muestra: cantidad de partidos, puntuación promedio

**Uso:** Evaluar el rendimiento general de los jugadores a lo largo de la temporada.

### Filtros Adicionales

Los rankings pueden filtrarse por:
- **Tipo de posición**: Forwards (1-8), Backs (9-15), o todos
- **Rival**: Partidos contra un oponente específico
- **Minutos mínimos**: Personalizar el umbral de tiempo

---

## Ejemplos Prácticos

### Ejemplo 1: Segunda Línea con Partido Completo

```
Jugador: Juan Pérez
Posición: Puesto 4 (2da Línea)
Tiempo de juego: 70 minutos

Estadísticas del partido:
┌─────────────────────┬───────┬──────────┬───────────┐
│ Estadística         │ Valor │ Peso P.4 │ Subtotal  │
├─────────────────────┼───────┼──────────┼───────────┤
│ tackles_positivos   │   8   │   +5.0   │   +40.0   │
│ tackles             │  12   │   +2.0   │   +24.0   │
│ tackles_errados     │   2   │   -4.0   │    -8.0   │
│ portador            │   5   │   +1.5   │    +7.5   │
│ ruck_ofensivos      │  10   │   +3.0   │   +30.0   │
│ pases               │   3   │   +0.3   │    +0.9   │
│ pases_malos         │   1   │   -1.5   │    -1.5   │
│ perdidas            │   0   │   -4.0   │     0.0   │
│ recuperaciones      │   1   │   +5.0   │    +5.0   │
│ gana_contacto       │   4   │   +3.0   │   +12.0   │
│ quiebres            │   1   │   +3.5   │    +3.5   │
│ penales             │   1   │   -5.0   │    -5.0   │
│ juego_pie           │   0   │   +0.5   │     0.0   │
│ recepcion_aire_buena│   2   │   +4.0   │    +8.0   │
│ recepcion_aire_mala │   0   │   -3.5   │     0.0   │
│ try_                │   0   │   +9.0   │     0.0   │
└─────────────────────┴───────┴──────────┴───────────┘

Cálculo:
score_absoluto = 40 + 24 - 8 + 7.5 + 30 + 0.9 - 1.5 + 5 + 12 + 3.5 - 5 + 8 = 116.4

tiempo_efectivo = max(70, 40) = 70

puntuacion_final = (116.4 / 70) × 70 = 116.4
```

**Resultado:** Puntuación final de **116.4** - Excelente rendimiento.

---

### Ejemplo 2: Wing Suplente (25 minutos)

```
Jugador: Carlos García
Posición: Puesto 14 (Wing)
Tiempo de juego: 25 minutos

Estadísticas del partido:
┌─────────────────────┬───────┬───────────┬───────────┐
│ Estadística         │ Valor │ Peso P.14 │ Subtotal  │
├─────────────────────┼───────┼───────────┼───────────┤
│ tackles_positivos   │   2   │   +2.5    │    +5.0   │
│ tackles             │   3   │   +1.0    │    +3.0   │
│ tackles_errados     │   1   │   -2.5    │    -2.5   │
│ portador            │   4   │   +2.0    │    +8.0   │
│ quiebres            │   2   │   +7.5    │   +15.0   │
│ try_                │   1   │  +12.0    │   +12.0   │
│ pases               │   8   │   +1.0    │    +8.0   │
│ pases_malos         │   0   │   -3.5    │     0.0   │
└─────────────────────┴───────┴───────────┴───────────┘

Cálculo:
score_absoluto = 5 + 3 - 2.5 + 8 + 15 + 12 + 8 = 48.5

tiempo_efectivo = max(25, 40) = 40  ← Se aplica el piso

puntuacion_final = (48.5 / 40) × 70 = 84.9
```

**Sin el piso sería:** `(48.5 / 25) × 70 = 135.8` ← Inflado artificialmente

**Resultado:** Puntuación final de **84.9** - Muy buen rendimiento en el tiempo jugado.

---

### Ejemplo 3: Jugador con Poco Tiempo (8 minutos)

```
Jugador: Luis Martínez
Posición: Puesto 6 (Ala)
Tiempo de juego: 8 minutos

Estadísticas: 1 tackle positivo

Cálculo:
score_absoluto = 1 × 5.5 = 5.5
tiempo_efectivo = max(8, 40) = 40
puntuacion_final = (5.5 / 40) × 70 = 9.6
```

**Importante:** Este jugador:
- ✓ Aparece en el ranking del partido individual
- ✗ **NO aparece** en rankings agregados (8 < 20 minutos mínimos)

---

### Ejemplo 4: Medio Scrum con Rendimiento Negativo

```
Jugador: Pedro Sánchez
Posición: Puesto 9 (Medio Scrum)
Tiempo de juego: 60 minutos

Estadísticas del partido:
┌─────────────────────┬───────┬──────────┬───────────┐
│ Estadística         │ Valor │ Peso P.9 │ Subtotal  │
├─────────────────────┼───────┼──────────┼───────────┤
│ tackles_positivos   │   1   │   +3.5   │    +3.5   │
│ tackles_errados     │   4   │   -3.0   │   -12.0   │
│ pases               │  15   │   +2.0   │   +30.0   │
│ pases_malos         │   6   │   -5.0   │   -30.0   │
│ perdidas            │   3   │   -4.5   │   -13.5   │
│ penales             │   2   │   -4.0   │    -8.0   │
└─────────────────────┴───────┴──────────┴───────────┘

Cálculo:
score_absoluto = 3.5 - 12 + 30 - 30 - 13.5 - 8 = -30.0

tiempo_efectivo = max(60, 40) = 60

puntuacion_final = (-30.0 / 60) × 70 = -35.0
```

**Resultado:** Puntuación final de **-35.0** - Partido muy negativo. Notar que el peso de pases_malos para puesto 9 (-5.0) es el más severo del sistema, reflejando que un medio scrum no puede permitirse errores de distribución.

---

## Configuración de Pesos

### Modificar Pesos

Los pesos se pueden modificar desde tres lugares:

1. **Interfaz de Usuario**: Página `/scoring` en el frontend con pestañas por posición (15 pestañas, una por puesto)
2. **Base de Datos**: Tabla `scoring_weights`
3. **Código**: Constante `DEFAULT_SCORING_WEIGHTS` en `backend/app/constants.py`

### Estructura de Base de Datos

```sql
-- Configuraciones de scoring (puede haber varias, solo una activa)
CREATE TABLE scoring_configurations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(500),
    is_active BOOLEAN DEFAULT FALSE
);

-- Pesos por acción y posición (una fila por config × acción × posición)
CREATE TABLE scoring_weights (
    id SERIAL PRIMARY KEY,
    config_id INTEGER REFERENCES scoring_configurations(id),
    action_name VARCHAR(50) NOT NULL,
    position INTEGER NOT NULL,
    weight FLOAT NOT NULL,
    UNIQUE(config_id, action_name, position)
);
```

Esto genera **240 filas** por configuración (16 acciones × 15 posiciones).

### Recalcular Puntuaciones

Después de modificar los pesos, es necesario recalcular todas las puntuaciones existentes:

```bash
cd backend && uv run rugby recalculate-scores
```

Este comando:
1. Obtiene la configuración de scoring activa
2. Recalcula `score_absoluto` y `puntuacion_final` para cada registro de `PlayerMatchStats`
3. Actualiza la base de datos con los nuevos valores

---

## Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `backend/app/services/scoring.py` | Lógica principal de cálculo de scores |
| `backend/app/constants.py` | Pesos por defecto (`DEFAULT_SCORING_WEIGHTS`), estadísticas y grupos de posición |
| `backend/app/models/scoring_config.py` | Modelos ORM (`ScoringConfiguration`, `ScoringWeight`) |
| `backend/app/api/stats.py` | Endpoints de rankings |
| `backend/app/api/scoring.py` | Endpoints de configuración de pesos |
| `backend/app/cli/commands.py` | Comandos CLI para recálculo |

---

## Resumen

El sistema de puntuación de Rugby Stats está diseñado para:

1. **Evaluar objetivamente** el rendimiento de cada jugador
2. **Diferenciar por posición** (15 puestos individuales) con pesos específicos para cada uno
3. **Normalizar el tiempo de juego** para comparaciones justas
4. **Prevenir la inflación** en jugadores con poco tiempo en cancha
5. **Ofrecer flexibilidad** permitiendo ajustar los pesos por posición desde la interfaz

La fórmula central es:

```
puntuacion_final = (Σ(estadística × peso_para_posición) / max(tiempo_juego, 40)) × 70
```

Esta metodología asegura que las puntuaciones sean comparables, justas y reflejen el verdadero impacto de cada jugador en el partido según las demandas específicas de su puesto.
