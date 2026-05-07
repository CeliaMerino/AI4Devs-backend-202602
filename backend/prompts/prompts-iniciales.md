# Prompts — Backend Kanban Candidates

## Asistente utilizado: Cursor
---

## Prompt 1 — Análisis de arquitectura

Analiza el repositorio que te voy a proporcionar. Identifica: (1) el patrón arquitectónico usado (capas, clean architecture, etc.), (2) cómo están organizados los modelos de Prisma y sus relaciones, (3) cómo están definidos los endpoints existentes —desde la ruta hasta el servicio—, (4) cómo se gestiona el manejo de errores. Dame un resumen claro antes de tocar ningún código.

---

## Prompt 2 — Mapeo del modelo de datos

Dado este schema de Prisma, explícame con detalle las relaciones entre las entidades `Position`, `Application`, `Candidate` e `Interview`. ¿Qué campos necesito para construir los endpoints `GET /positions/:id/candidates` y `PUT /candidates/:id/stage`? Muéstramelo con un diagrama en texto y con las queries Prisma que necesitaría.

---

## Prompt 3 — Implementación GET /positions/:id/candidates

Siguiendo exactamente el mismo patrón arquitectónico que ya existe en el proyecto (rutas → controller → service → modelo/repositorio con Prisma), implementa el endpoint `GET /positions/:id/candidates`.

Requisitos funcionales:
- Devuelve todos los candidatos con una `Application` para el `positionId` dado
- Por cada candidato incluye:
  - Nombre completo (`firstName` + `lastName` de `Candidate`)
  - `currentInterviewStep`: el objeto `InterviewStep` completo (`id`, `name`, `orderIndex`)
  - `averageScore`: puntuación media de todas sus `Interview` para esa aplicación. Si no tiene interviews, devuelve `null`
- Manejo de errores: posición no encontrada → 404, error interno → 500
- Respeta el estilo de código y nomenclatura del proyecto

Query Prisma de referencia (úsala como base):

```typescript
const candidatesInPosition = await prisma.application.findMany({
  where: { positionId: Number(positionId) },
  select: {
    id: true,
    applicationDate: true,
    notes: true,
    candidate: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    },
    interviewStep: {
      select: {
        id: true,
        name: true,
        orderIndex: true,
      },
    },
    interviews: {
      select: {
        id: true,
        interviewDate: true,
        result: true,
        score: true,
        notes: true,
      },
      orderBy: { interviewDate: "desc" },
    },
  },
  orderBy: { applicationDate: "desc" },
});
```

Para el cálculo de `averageScore`: añádelo calculándolo en el servicio tras obtener los datos, mapeando el resultado así:
- Si `interviews.length === 0` → `averageScore: null`
- Si algún `score` es `null` → ignóralo en el cálculo (solo promedia los no nulos)
- Si todos los scores son `null` → `averageScore: null`

Crea todos los ficheros necesarios siguiendo la estructura existente del proyecto y registra la ruta en el fichero de rutas correspondiente. Asegúrate de que los middlewares de validación (si los hay en el proyecto) se apliquen correctamente.

---

## Prompt 4 — Implementación PUT /candidates/:id/stage

Siguiendo el mismo patrón arquitectónico del proyecto (rutas → controller → service → Prisma), implementa el endpoint `PUT /candidates/:id/stage`.

Requisitos funcionales:
- Path param: `candidateId` (id del candidato)
- Body: `{ applicationId: number, currentInterviewStep: number }` donde `currentInterviewStep` es el ID del `InterviewStep` destino
- Valida que la `Application` existe Y pertenece al `candidateId` del path. Si no existe o no pertenece a ese candidato → 404
- Valida que el body tiene los campos requeridos y son números válidos → 400
- Devuelve la aplicación actualizada
- Manejo de errores: candidato no encontrado → 404, aplicación no encontrada o no pertenece al candidato → 404, datos inválidos → 400, error interno → 500

Query Prisma de referencia — úsala exactamente así para la validación de pertenencia antes de actualizar:

```typescript
// Paso 1: validar que la application existe y pertenece al candidate
const app = await prisma.application.findFirst({
  where: {
    id: applicationId,
    candidateId: Number(candidateId),
  },
  select: { id: true, positionId: true, currentInterviewStep: true },
});
if (!app) throw new Error("Application not found for candidate");

// Paso 2: actualizar
const updated = await prisma.application.update({
  where: { id: app.id },
  data: { currentInterviewStep: nextInterviewStepId },
  select: {
    id: true,
    candidateId: true,
    positionId: true,
    currentInterviewStep: true,
  },
});
```

Crea todos los ficheros necesarios siguiendo la estructura existente del proyecto y registra la ruta en el fichero de rutas correspondiente. Asegúrate de que los middlewares de validación (si los hay en el proyecto) se apliquen correctamente.

---

## Prompt 5 — Tests

Crea tests para los dos endpoints nuevos siguiendo el patrón de testing existente en el proyecto (Jest + Supertest o el que use el proyecto).

Para cada endpoint necesito:
- Test del caso happy path
- Test con ID inexistente (404)
- Test con datos inválidos en el body (400)
- Mock de Prisma Client para no depender de la base de datos real

---

## Prompt 6 — Validación de edge cases

Revisa la implementación de ambos endpoints y dime si hay edge cases no cubiertos. Específicamente:
- ¿Qué pasa si un candidato no tiene ninguna entrevista? ¿La media es `null`, `0` o se omite?
- ¿Qué pasa si se intenta mover a un candidato a un step que no existe en el proceso de esa posición?
- ¿Hay race conditions posibles en el PUT?

Propón soluciones para cada caso e impleméntalas si suponen un cambio en el código.