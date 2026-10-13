import type { CSSProperties } from 'react'
import Image from 'next/image'

const LINEAS = ['Agua purificada.', 'Tu casa abastecida.']
const ESTILO_BIDON = 'h-auto w-[272px] max-w-full md:w-[336px] lg:w-[400px]'

export function Hero() {
  return (
    <section id="inicio" aria-labelledby="hero-titulo" className="relative isolate overflow-hidden bg-viflomax-azul-900 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-20 h-[32rem] w-[32rem] rounded-full bg-viflomax-azul/30 blur-3xl md:top-0 md:h-[42rem] md:w-[42rem]" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-72 w-96 rounded-full bg-viflomax-azul-300/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/30" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-6 pb-16 pt-10 md:grid-cols-[1.2fr_0.8fr] md:gap-6 md:pb-24 md:pt-16">
        <div>
          <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-viflomax-azul-300">
            <svg aria-hidden="true" viewBox="0 0 20 26" className="h-5 w-4 fill-current"><path d="M10 0C6 6 1 12 1 17a9 9 0 0018 0C19 12 14 6 10 0Z" /></svg>
            Maipú y Padre Hurtado
          </p>
          <h1 id="hero-titulo" className="mb-6 font-nunito text-[2.5rem] font-extrabold leading-[1.04] tracking-tight max-[360px]:text-[2.1875rem] md:text-[3.25rem] lg:text-[4.75rem]">
            <span className="sr-only">{LINEAS.join(' ')}</span>
            <span aria-hidden="true">
              {LINEAS.map((linea, fila) => (
                <span key={linea} className={fila === 1 ? 'block text-viflomax-azul-300' : 'block'}>
                  {linea.split(' ').map((palabra, columna) => (
                    <span key={`${fila}-${columna}`}>
                      {columna > 0 ? ' ' : null}
                      <span className="hero-palabra-mascara"><span className="hero-palabra" style={{ '--indice': fila * 2 + columna } as CSSProperties}>{palabra}</span></span>
                    </span>
                  ))}
                </span>
              ))}
            </span>
          </h1>
          <p className="hero-intro mb-6 max-w-md text-base leading-relaxed text-viflomax-azul-300 md:mb-8 md:text-lg">
            Agua a domicilio en Maipú y Padre Hurtado. Elige tus recargas, bidones y dispensadores; nosotros confirmamos la entrega.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#pedido" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-viflomax-verde-700 px-6 py-3 text-sm font-bold hover:bg-viflomax-verde-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              Pedir ahora <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4"><path d="M10 3v14M4 11l6 6 6-6" /></svg>
            </a>
            <a href="#productos" className="inline-flex min-h-12 items-center justify-center rounded-full border border-viflomax-azul-300 px-6 py-3 text-sm font-bold hover:bg-viflomax-azul-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              Ver productos
            </a>
          </div>
          <ol aria-label="Cómo pedir" className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-viflomax-azul-300">
            {['Elige tu formato', 'Haz tu pedido', 'Confirmamos entrega'].map((paso, indice) => (
              <li key={paso} className="flex items-center gap-2"><span className="font-bold text-white">0{indice + 1}</span>{paso}</li>
            ))}
          </ol>
        </div>
        <figure className="relative m-0 grid min-w-0 place-items-center pb-10 md:pb-12">
          <div className="hero-imagen-entrada relative max-w-full">
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-1 left-1/2 h-6 w-3/5 -translate-x-1/2 rounded-[50%] bg-viflomax-azul-900 blur-md" />
            <div className="hero-producto relative">
              <Image src="/productos/hero-bidon.png" alt="Bidón de 20 litros de agua purificada Viflomax" width={1122} height={1402} priority sizes="(max-width: 767px) 272px, (max-width: 1023px) 336px, 400px" className={ESTILO_BIDON} />
            </div>
            <div aria-hidden="true" className="hero-reflejo pointer-events-none absolute inset-x-0 top-full h-12 overflow-hidden">
              <Image src="/productos/hero-bidon.png" alt="" width={1122} height={1402} sizes="(max-width: 767px) 272px, (max-width: 1023px) 336px, 400px" className={`${ESTILO_BIDON} -scale-y-100 opacity-20`} />
            </div>
          </div>
          <figcaption className="absolute bottom-4 right-0 rounded-2xl border border-viflomax-azul-300/40 bg-viflomax-azul-800 px-4 py-3 text-xs uppercase md:bottom-8">
            Tu formato de siempre<span className="block text-xl font-extrabold normal-case md:text-2xl">20 litros</span>
          </figcaption>
        </figure>
      </div>
      <svg aria-hidden="true" viewBox="0 0 1440 60" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-px left-0 h-10 w-full fill-white"><path d="M0 35C310 70 460 0 760 27S1170 67 1440 25V60H0Z" /></svg>
    </section>
  )
}
