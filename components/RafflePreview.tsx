'use client'

import Countdown from '@/components/Countdown'

function money(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function RafflePreview({
  raffle,
  compact = false,
  banner = false,
}: {
  raffle: any
  compact?: boolean
  banner?: boolean
}) {
  const total = Math.max(
    1,
    Number(raffle?.total_numbers || 50)
  )

  const shown = Math.min(
    total,
    compact ? 30 : 100
  )

  const gallery = Array.isArray(raffle?.gallery_images)
    ? raffle.gallery_images
    : []

  const title =
    raffle?.title ||
    'Título de tu rifa'

  const description =
    raffle?.description ||
    'Aquí aparecerá la descripción del premio y de la rifa.'

  const price = Number(
    raffle?.price ??
      ((raffle?.price_cents || 0) / 100)
  )

  const hero =
    raffle?.hero_image || ''

  const closes =
    raffle?.closes_at || ''

  const terms = String(
    raffle?.terms_text || ''
  ).trim()

  const delivery = String(
    raffle?.delivery_text || ''
  ).trim()

  return (
    <div
      className={
        compact
          ? 'previewCanvas compact'
          : 'previewCanvas'
      }
    >
      {banner && (
        <div className="previewBanner">
          <b>👁 MODO VISTA PREVIA</b>
          <span>
            Esta rifa todavía no está publicada.
          </span>
        </div>
      )}

      <section className="hero previewHero">
        <div>
          <span className="badge">
            SOLO {total} NÚMEROS
          </span>

          <h1>{title}</h1>

          <p className="muted">
            {description}
          </p>

          <div className="price">
            {money(price)}
            {' '}
            <small>por número</small>
          </div>

          {closes && (
            <Countdown target={closes} />
          )}
        </div>

        {hero ? (
          <img
            src={hero}
            alt={title}
          />
        ) : (
          <div className="previewImagePlaceholder">
            Imagen principal
          </div>
        )}
      </section>

      <section className="card">
        <h2>Elige tu número 🍀</h2>

        <p className="muted">
          Así se verá el tablero para tus participantes.
        </p>

        <div className="numberGrid previewNumbers">
          {Array.from(
            { length: shown },
            (_, index) => index + 1
          ).map((number) => (
            <button
              key={number}
              type="button"
              className="number available"
              disabled
            >
              {String(number).padStart(2, '0')}
            </button>
          ))}
        </div>

        {shown < total && (
          <p className="muted">
            + {total - shown} números adicionales
          </p>
        )}

        <button
          type="button"
          className="btn"
          disabled
        >
          Apartar número
        </button>
      </section>

      {(hero || gallery.length > 0) && (
        <section className="card">
          <h2>El premio</h2>

          <div className="gallery">
            {hero && (
              <img
                src={hero}
                alt={title}
              />
            )}

            {gallery.map(
              (image: string, index: number) => (
                <img
                  key={`${image}-${index}`}
                  src={image}
                  alt={`${title} ${index + 2}`}
                />
              )
            )}
          </div>
        </section>
      )}

      <section className="card">
        <h2>¿Cómo funciona?</h2>

        <p>
          1. Elige un número disponible.
          {' '}
          2. Escribe tu nombre y WhatsApp.
          {' '}
          3. Tu número quedará apartado temporalmente.
          {' '}
          4. Continúa por WhatsApp para recibir las
          instrucciones de pago.
          {' '}
          5. Una vez confirmado el pago, tu número
          aparecerá como pagado.
        </p>
      </section>

      {delivery && (
        <section className="card">
          <h2>Entrega del premio</h2>

          <p>{delivery}</p>
        </section>
      )}

      {terms && (
        <section className="card">
          <h2>Bases y condiciones</h2>

          <p
            style={{
              whiteSpace: 'pre-wrap',
            }}
          >
            {terms}
          </p>
        </section>
      )}

      {banner && (
        <section className="card">
          <div className="previewBanner">
            <b>🧪 Vista previa solamente</b>
            <span>
              Los botones están deshabilitados y no se
              pueden generar apartados desde esta pantalla.
            </span>
          </div>
        </section>
      )}
    </div>
  )
}
