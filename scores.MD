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

1. **Pondera las estadísticas** según la posición del jugador (forwards vs backs)
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
- Los pesos varían según si el jugador es forward (puestos 1-8) o back (puestos 9-15)
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
score_absoluto = Σ (estadística × peso)
```

Donde:
- **Σ** = Sumatoria de todas las estadísticas
- **estadística** = Valor numérico de cada acción (tackles, pases, etc.)
- **peso** = Multiplicador según la posición del jugador

**Ejemplo:**
```
tackles_positivos: 5  ×  peso_forward: 5.0  =  25.0
tackles_errados: 2    ×  peso_forward: -4.0 =  -8.0
ruck_ofensivos: 8     ×  peso_forward: 2.5  =  20.0
                                            -------
                              score_absoluto = 37.0
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

Los pesos determinan cuánto impacta cada estadística en la puntuación final. Están diferenciados por posición:

### Clasificación de Posiciones

| Tipo | Puestos | Posiciones |
|------|---------|------------|
| **Forwards** | 1-8 | Pilares, Hooker, Segunda línea, Flankers, Número 8 |
| **Backs** | 9-15 | Medio scrum, Apertura, Centros, Wings, Fullback |

### Tabla de Pesos por Estadística

| Estadística | Peso Forwards | Peso Backs | Tipo | Descripción |
|-------------|:-------------:|:----------:|:----:|-------------|
| `tackles_positivos` | **+5.0** | +3.0 | Positivo | Tackles efectivos que detienen al rival |
| `tackles` | +2.0 | +1.5 | Positivo | Total de tackles intentados |
| `tackles_errados` | **-4.0** | -3.0 | Negativo | Tackles fallados que permiten avance rival |
| `portador` | +1.5 | +1.2 | Positivo | Veces que el jugador llevó la pelota |
| `ruck_ofensivos` | **+2.5** | +0.5 | Positivo | Participación en rucks de ataque |
| `pases` | +0.5 | **+1.2** | Positivo | Pases realizados correctamente |
| `pases_malos` | -2.0 | **-4.0** | Negativo | Pases errados o interceptados |
| `perdidas` | -4.0 | **-5.0** | Negativo | Pérdidas de balón |
| `recuperaciones` | **+5.0** | +4.0 | Positivo | Recuperaciones de balón al rival |
| `gana_contacto` | +3.0 | **+4.0** | Positivo | Contactos físicos ganados |
| `quiebres` | +4.0 | **+7.0** | Positivo | Líneas defensivas quebradas |
| `penales` | **-5.0** | -4.0 | Negativo | Penales concedidos |
| `juego_pie` | +1.0 | **+3.0** | Positivo | Juego táctico con el pie |
| `recepcion_aire_buena` | +3.0 | **+5.0** | Positivo | Recepciones aéreas exitosas |
| `recepcion_aire_mala` | -3.0 | **-4.0** | Negativo | Recepciones aéreas falladas |
| `try_` | +10.0 | **+12.0** | Positivo | Tries anotados |

### Filosofía de los Pesos

#### Acciones Positivas (pesos positivos)
- Recompensan acciones que benefician al equipo
- A mayor impacto de la acción, mayor peso

#### Errores (pesos negativos)
- Penalizan acciones que perjudican al equipo
- Un tackle errado o una pérdida pueden cambiar el partido

#### Diferenciación por Posición

**Forwards tienen más peso en:**
- Tackles (defensivos y agresivos)
- Rucks ofensivos (trabajo físico en breakdown)
- Recuperaciones (robo de balón)
- Penales (más penalizados por infracciones)

**Backs tienen más peso en:**
- Pases (son distribuidores principales)
- Quiebres (se espera que rompan líneas)
- Tries (finalizadores naturales)
- Juego aéreo y de pie (habilidades técnicas)

---

## Normalización y Control de Inflación

### El Problema de la Inflación

Sin control, un jugador que juega pocos minutos puede obtener puntuaciones exageradas:

**Ejemplo sin piso de normalización:**
```
Jugador: Suplente que entró 10 minutos
Estadísticas: 2 tackles positivos

score_absoluto = 2 × 5.0 = 10
puntuacion_final = (10 / 10) × 70 = 70  ← ¡Puntuación inflada!
```

Este jugador aparecería con la misma puntuación que alguien que jugó 70 minutos completos.

### La Solución: Piso de Normalización

Se establece un **piso mínimo de 40 minutos** para el cálculo:

**Ejemplo con piso de normalización:**
```
Jugador: Suplente que entró 10 minutos
Estadísticas: 2 tackles positivos

score_absoluto = 2 × 5.0 = 10
tiempo_efectivo = max(10, 40) = 40  ← Se aplica el piso
puntuacion_final = (10 / 40) × 70 = 20  ← Puntuación realista
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
# services/scoring.py

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

### Ejemplo 1: Forward con Partido Completo

```
Jugador: Juan Pérez
Posición: Puesto 4 (Segunda línea - Forward)
Tiempo de juego: 70 minutos

Estadísticas del partido:
┌─────────────────────┬───────┬───────────┬───────────┐
│ Estadística         │ Valor │ Peso Fwd  │ Subtotal  │
├─────────────────────┼───────┼───────────┼───────────┤
│ tackles_positivos   │   8   │   +5.0    │   +40.0   │
│ tackles             │  12   │   +2.0    │   +24.0   │
│ tackles_errados     │   2   │   -4.0    │    -8.0   │
│ portador            │   5   │   +1.5    │    +7.5   │
│ ruck_ofensivos      │  10   │   +2.5    │   +25.0   │
│ pases               │   3   │   +0.5    │    +1.5   │
│ pases_malos         │   1   │   -2.0    │    -2.0   │
│ perdidas            │   0   │   -4.0    │     0.0   │
│ recuperaciones      │   1   │   +5.0    │    +5.0   │
│ gana_contacto       │   4   │   +3.0    │   +12.0   │
│ quiebres            │   1   │   +4.0    │    +4.0   │
│ penales             │   1   │   -5.0    │    -5.0   │
│ juego_pie           │   0   │   +1.0    │     0.0   │
│ recepcion_aire_buena│   2   │   +3.0    │    +6.0   │
│ recepcion_aire_mala │   0   │   -3.0    │     0.0   │
│ try_                │   0   │  +10.0    │     0.0   │
└─────────────────────┴───────┴───────────┴───────────┘

Cálculo:
score_absoluto = 40 + 24 - 8 + 7.5 + 25 + 1.5 - 2 + 5 + 12 + 4 - 5 + 6 = 110.0

tiempo_efectivo = max(70, 40) = 70

puntuacion_final = (110.0 / 70) × 70 = 110.0
```

**Resultado:** Puntuación final de **110.0** - Excelente rendimiento.

---

### Ejemplo 2: Back Suplente (25 minutos)

```
Jugador: Carlos García
Posición: Puesto 14 (Wing - Back)
Tiempo de juego: 25 minutos

Estadísticas del partido:
┌─────────────────────┬───────┬───────────┬───────────┐
│ Estadística         │ Valor │ Peso Back │ Subtotal  │
├─────────────────────┼───────┼───────────┼───────────┤
│ tackles_positivos   │   2   │   +3.0    │    +6.0   │
│ tackles             │   3   │   +1.5    │    +4.5   │
│ tackles_errados     │   1   │   -3.0    │    -3.0   │
│ portador            │   4   │   +1.2    │    +4.8   │
│ quiebres            │   2   │   +7.0    │   +14.0   │
│ try_                │   1   │  +12.0    │   +12.0   │
│ pases               │   8   │   +1.2    │    +9.6   │
│ pases_malos         │   0   │   -4.0    │     0.0   │
└─────────────────────┴───────┴───────────┴───────────┘

Cálculo:
score_absoluto = 6 + 4.5 - 3 + 4.8 + 14 + 12 + 9.6 = 47.9

tiempo_efectivo = max(25, 40) = 40  ← Se aplica el piso

puntuacion_final = (47.9 / 40) × 70 = 83.8
```

**Sin el piso sería:** `(47.9 / 25) × 70 = 134.1` ← Inflado artificialmente

**Resultado:** Puntuación final de **83.8** - Muy buen rendimiento en el tiempo jugado.

---

### Ejemplo 3: Jugador con Poco Tiempo (8 minutos)

```
Jugador: Luis Martínez
Posición: Puesto 21 (Suplente)
Tiempo de juego: 8 minutos

Estadísticas: 1 tackle positivo

Cálculo:
score_absoluto = 1 × 5.0 = 5.0
tiempo_efectivo = max(8, 40) = 40
puntuacion_final = (5 / 40) × 70 = 8.75
```

**Importante:** Este jugador:
- ✓ Aparece en el ranking del partido individual
- ✗ **NO aparece** en rankings agregados (8 < 20 minutos mínimos)

---

### Ejemplo 4: Partido con Rendimiento Negativo

```
Jugador: Pedro Sánchez
Posición: Puesto 9 (Medio scrum - Back)
Tiempo de juego: 60 minutos

Estadísticas del partido:
┌─────────────────────┬───────┬───────────┬───────────┐
│ Estadística         │ Valor │ Peso Back │ Subtotal  │
├─────────────────────┼───────┼───────────┼───────────┤
│ tackles_positivos   │   1   │   +3.0    │    +3.0   │
│ tackles_errados     │   4   │   -3.0    │   -12.0   │
│ pases               │  15   │   +1.2    │   +18.0   │
│ pases_malos         │   6   │   -4.0    │   -24.0   │
│ perdidas            │   3   │   -5.0    │   -15.0   │
│ penales             │   2   │   -4.0    │    -8.0   │
└─────────────────────┴───────┴───────────┴───────────┘

Cálculo:
score_absoluto = 3 - 12 + 18 - 24 - 15 - 8 = -38.0

tiempo_efectivo = max(60, 40) = 60

puntuacion_final = (-38.0 / 60) × 70 = -44.3
```

**Resultado:** Puntuación final de **-44.3** - Partido muy negativo con muchos errores.

---

## Configuración de Pesos

### Modificar Pesos

Los pesos se pueden modificar desde tres lugares:

1. **Interfaz de Usuario**: Página `/scoring` en el frontend
2. **Base de Datos**: Tabla `scoring_weights`
3. **Código**: Constante `DEFAULT_SCORING_WEIGHTS` en `models/scoring_config.py`

### Estructura de Base de Datos

```sql
-- Configuraciones de scoring (puede haber varias, solo una activa)
CREATE TABLE scoring_configurations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(500),
    is_active BOOLEAN DEFAULT FALSE
);

-- Pesos por acción y posición
CREATE TABLE scoring_weights (
    id SERIAL PRIMARY KEY,
    config_id INTEGER REFERENCES scoring_configurations(id),
    action_name VARCHAR(50) NOT NULL,
    forwards_weight FLOAT NOT NULL,
    backs_weight FLOAT NOT NULL,
    UNIQUE(config_id, action_name)
);
```

### Recalcular Puntuaciones

Después de modificar los pesos, es necesario recalcular todas las puntuaciones existentes:

```bash
uv run rugby recalculate-scores
```

Este comando:
1. Obtiene la configuración de scoring activa
2. Recalcula `score_absoluto` y `puntuacion_final` para cada registro de `PlayerMatchStats`
3. Actualiza la base de datos con los nuevos valores

---

## Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `src/rugby_stats/services/scoring.py` | Lógica principal de cálculo de scores |
| `src/rugby_stats/models/scoring_config.py` | Modelos ORM y pesos por defecto |
| `src/rugby_stats/api/stats.py` | Endpoints de rankings |
| `src/rugby_stats/cli/commands.py` | Comandos CLI para recálculo |

---

## Resumen

El sistema de puntuación de Rugby Stats está diseñado para:

1. **Evaluar objetivamente** el rendimiento de cada jugador
2. **Diferenciar por posición** (forwards vs backs) con pesos específicos
3. **Normalizar el tiempo de juego** para comparaciones justas
4. **Prevenir la inflación** en jugadores con poco tiempo en cancha
5. **Ofrecer flexibilidad** permitiendo ajustar los pesos según necesidad

La fórmula central es:

```
puntuacion_final = (Σ(estadística × peso) / max(tiempo_juego, 40)) × 70
```

Esta metodología asegura que las puntuaciones sean comparables, justas y reflejen el verdadero impacto de cada jugador en el partido.
