# Panel Polleria Entre Rios

Panel simple para listar telefonos y pausar/reactivar la IA desde Vercel.

## Variables de entorno

Configurar en Vercel:

```env
DASHBOARD_USER=admin
DASHBOARD_PASSWORD=una-clave-segura
SESSION_SECRET=un-secreto-largo-aleatorio
API_LIST_URL=https://tu-api.com/telefonos
API_TOGGLE_URL=https://tu-api.com/telefonos/ia
API_TOKEN=token-opcional-si-tu-api-lo-pide
```

`API_LIST_URL` debe devolver JSON como array o dentro de `data`, `items`, `phones` o `telefonos`.

Campos soportados por item:

- Telefono: `phone`, `telefono`, `number`, `numero`, `whatsapp`
- Nombre: `name`, `nombre`, `customer`, `cliente`
- IA activa: `aiEnabled`, `iaActiva`, `botEnabled`, `botActivo`, `enabled`, `active`, `activo`

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
