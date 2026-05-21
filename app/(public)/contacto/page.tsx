export const metadata = {
  title: 'Contacto — Agua Viflomax',
  description: 'Contáctanos para pedidos de agua purificada en Maipú. WhatsApp y formulario disponibles.',
}

export default function ContactoPage() {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
  const telefonoDisplay = waNumber ? `+${waNumber}` : '+56 9 XXXX XXXX'
  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=Hola%2C%20quiero%20hacer%20un%20pedido`
    : '#'

  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="font-nunito text-4xl font-bold text-gray-900 mb-3">Contáctanos</h1>
          <p className="text-gray-500 text-lg">
            Estamos para ayudarte. Escríbenos o llámanos cuando necesites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-start gap-4">
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-viflomax-azul/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-6 h-6 fill-viflomax-azul"
                aria-hidden="true"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </span>
            <div>
              <h2 className="font-nunito font-bold text-gray-900 text-lg mb-1">Ubicación</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Maipú, Región Metropolitana, Chile
              </p>
            </div>
          </div>

          {/* Phone */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-start gap-4">
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-viflomax-verde/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-6 h-6 fill-viflomax-verde"
                aria-hidden="true"
              >
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02l-2.21 2.2z" />
              </svg>
            </span>
            <div>
              <h2 className="font-nunito font-bold text-gray-900 text-lg mb-1">Teléfono</h2>
              <p className="text-gray-600 text-sm">{telefonoDisplay}</p>
            </div>
          </div>

          {/* Hours */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-start gap-4">
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-6 h-6 fill-yellow-600"
                aria-hidden="true"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 15H11v-6h1.5v6zm0-8H11V7h1.5v2z" />
              </svg>
            </span>
            <div>
              <h2 className="font-nunito font-bold text-gray-900 text-lg mb-1">Horario</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Lunes a Sábado<br />8:00 – 20:00 hrs
              </p>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-start gap-4">
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                className="w-6 h-6 fill-green-600"
                aria-hidden="true"
              >
                <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.736 5.47 2.027 7.773L0 32l8.437-2.008A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm7.27 20.126c-.398-.199-2.353-1.161-2.718-1.294-.364-.132-.63-.199-.896.2-.265.399-1.028 1.294-1.26 1.56-.232.265-.464.299-.862.1-.398-.2-1.68-.619-3.2-1.975-1.183-1.055-1.981-2.358-2.214-2.756-.233-.399-.025-.614.175-.812.18-.179.398-.465.597-.698.2-.233.265-.399.399-.665.133-.266.066-.498-.033-.698-.1-.199-.896-2.16-1.228-2.957-.322-.778-.65-.672-.896-.684l-.763-.013c-.265 0-.697.1-1.062.499-.364.398-1.393 1.362-1.393 3.32s1.427 3.853 1.626 4.119c.199.265 2.808 4.287 6.803 6.014.951.41 1.693.655 2.272.838.955.304 1.823.261 2.51.158.765-.114 2.353-.962 2.685-1.89.333-.928.333-1.724.233-1.89-.1-.166-.365-.265-.763-.465z" />
              </svg>
            </span>
            <div>
              <h2 className="font-nunito font-bold text-gray-900 text-lg mb-2">WhatsApp</h2>
              <p className="text-gray-600 text-sm mb-4">
                La forma más rápida de hacer tu pedido o resolver dudas.
              </p>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors duration-200"
              >
                Escribir por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
