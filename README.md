# StudyBattle AI

App movil de aprendizaje gamificado donde los estudiantes suben de nivel respondiendo preguntas generadas por IA.

## Backend

El backend MVP esta en `backend/` y usa Node.js + Express.

### Configurar

```bash
cd backend
npm install
copy .env.example .env
```

Edita `backend/.env`:

```env
OPENAI_API_KEY=tu_api_key_aqui
OPENAI_MODEL=gpt-5.6
AI_PROVIDER=auto
```

Si no pones `OPENAI_API_KEY`, el backend usa `mock` automaticamente para que puedas probar login, materias, ranking y preguntas falsas.

### Ejecutar

```bash
npm run dev
```

URL local:

```text
http://localhost:4000/api
```

### Endpoints MVP

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/users/me/avatar`
- `GET /api/subjects`
- `POST /api/ai/questions`
- `POST /api/ai/explain`
- `POST /api/progress/answer`
- `GET /api/ranking`

Las rutas privadas usan:

```http
Authorization: Bearer TOKEN
```
