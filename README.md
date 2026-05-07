# Panel Polleria Entre Rios

Panel simple para listar telefonos y pausar/reactivar la IA desde Vercel.

## Variables de entorno

Configurar en Vercel:

```env
DASHBOARD_USER=admin
DASHBOARD_PASSWORD=una-clave-segura
SESSION_SECRET=un-secreto-largo-aleatorio
API_LIST_URL=https://tu-api.com/telefonos
API_LIST_METHOD=POST
API_TOGGLE_URL=https://tu-api.com/telefonos/ia
API_TOKEN=token-opcional-si-tu-api-lo-pide
CLIENTES_BOT_API_KEY=token-opcional-para-api-clientes-bot
```

`API_LIST_URL` puede ser el webhook de n8n:

```env
API_LIST_URL=https://n8n.srv1224751.hstgr.cloud/webhook/db-polleria
API_LIST_METHOD=POST
```

Ese flujo debe responder JSON como array o dentro de `data`, `items`, `rows`, `records`, `phones`, `telefonos` o `clientes`.

El webhook de n8n tiene que devolver los telefonos en la misma respuesta HTTP. Si responde solo `{ "message": "Workflow was started" }`, el panel no puede mostrar datos porque el flujo quedo asincronico.

Campos soportados por item:

- Telefono: `phone`, `telefono`, `number`, `numero`, `whatsapp`
- Nombre: `name`, `nombre`, `customer`, `cliente`
- IA activa: `aiEnabled`, `iaActiva`, `botEnabled`, `botActivo`, `enabled`, `active`, `activo`
- IA pausada/desactivada: `bot_desactivado`, `botDesactivado`, `ia_desactivada`, `iaDesactivada`, `disabled`, `desactivado`

Si el flujo de n8n necesita llamar al panel, puede usar:

```text
POST /api/clientes-bot
```

con un body `{ "clientes": [...] }`. Si configuraste `CLIENTES_BOT_API_KEY`, enviar el mismo valor en el header `x-api-key`.

`API_TOGGLE_URL` recibe:

```json
{
  "phone": "3430000000",
  "aiEnabled": false
}
```

## Desarrollo local

```bash
npm install
npm run dev
```

`npm run dev` levanta `http://localhost:3000` y abre el navegador. Para no abrirlo automaticamente:

```bash
$env:NO_OPEN=1; npm run dev
```
