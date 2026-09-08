# Punto de Suerte v0.9

Versión candidata a preproducción construida sobre v0.8.

## Novedades
- Branding público **Punto de Suerte**.
- Home profesional con tarjetas, precio, avance y estados.
- Estados públicos derivados: ACTIVA, PRÓXIMAMENTE, AGOTADA y FINALIZADA.
- Campo opcional de apertura pública (`opens_at`).
- Página pública refinada y bloqueo visual de apartados fuera de ventana.
- Compartir por WhatsApp y copiar enlace.
- Metadata Open Graph/Twitter por rifa para compartir enlaces con imagen y descripción.
- Favicon y página 404.
- Página "Cómo funciona".
- Admin marcado `noindex`.
- Headers básicos de seguridad para producción.
- API pública ya no expone borradores.
- La Secret/Service Role Key sigue exclusivamente en backend.

## Instalación desde v0.8
```bash
cd ~/Documents/"PROYECTO RIFA"/rifas-v0.9
cp ../rifas-v0.8/.env.local .env.local
npm install
```

Agrega a `.env.local`:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Migración v1.0
En una base creada desde v0.9, ejecuta **solo** `supabase/migration-v1.0.sql` en Supabase SQL Editor. No repitas `schema.sql` ni migraciones anteriores.

## Probar
```bash
npm run dev
```
- Público: http://localhost:3000
- Admin: http://localhost:3000/admin

## Antes de Vercel
Cambia `NEXT_PUBLIC_SITE_URL` por el dominio HTTPS definitivo y configura todas las variables de entorno en Vercel. Define valores robustos para `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET`; la administración se bloqueará si falta cualquiera de las dos. Ejecuta `npm run build` localmente antes de desplegar.

## Despliegue con Coolify
El proyecto incluye `Dockerfile` para desplegarlo desde un repositorio Git en Coolify.

1. Crea una aplicación desde el repositorio y elige **Dockerfile** como método de compilación.
2. Expón el puerto `3000` y asigna el dominio HTTPS definitivo.
3. Configura en Coolify `NEXT_PUBLIC_SITE_URL` como variable de compilación y también de ejecución, con el dominio HTTPS sin `/` final.
4. Configura como variables de ejecución: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET`.
5. Ejecuta `supabase/migration-v1.0.sql` en Supabase antes de activar el despliegue.
