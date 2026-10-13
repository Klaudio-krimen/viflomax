import type { CSSProperties } from 'react'
import Image from 'next/image'
import { PRODUCTOS } from '@/lib/productos'

const LINEAS = ['Agua purificada', 'a domicilio.']
const PRODUCTO_HERO = PRODUCTOS.find((producto) => producto.destacado) ?? PRODUCTOS[0]

export function Hero() {
  return (
    <section id="inicio" aria-labelledby="hero-titulo" className="relative isolate overflow-hidden bg-viflomax-azul-900 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-32 h-[42rem] w-[42rem] rounded-full bg-viflomax-azul/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-viflomax-verde/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/30" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-6 pb-16 pt-10 md:grid-cols-[1.15fr_0.85fr] md:gap-10 md:pb-28 md:pt-20">
        <div>
          <p className="mb-5 flex items-center gap-2 text-xs font-semibold tracking-wide text-viflomax-azul-300">
            <svg aria-hidden="true" viewBox="0 0 20 26" className="h-5 w-4 fill-current"><path d="M10 0C6 6 1 12 1 17a9 9 0 0018 0C19 12 14 6 10 0Z" /></svg>
            MAIPÚ Y PADRE HURTADO
          </p>
          <h1 id="hero-titulo" className="mb-6 font-nunito text-[2.625rem] font-extrabold leading-[1.09] tracking-tight max-[360px]:text-[2.3125rem] lg:text-[4.125rem]">
            <span className="sr-only">{LINEAS.join(' ')}</span>
            <span aria-hidden="true">
              {LINEAS.map((linea, fila) => (
                <span key={linea} className={fila === 1 ? 'block text-viflomax-azul-300' : 'block'}>
                  {linea.split(' ').map((palabra, columna) => (
                    <span key={palabra}>
                      {columna > 0 ? ' ' : null}
                      <span className="hero-palabra-mascara"><span className="hero-palabra" style={{ '--indice': fila * 2 + columna } as CSSProperties}>{palabra}</span></span>
                    </span>
                  ))}
                </span>
              ))}
            </span>
          </h1>
          <p className="hero-intro mb-6 max-w-md text-base leading-relaxed text-viflomax-azul-300 md:mb-8 md:text-lg">
            Recargas, bidones y dispensadores para tu casa. Elige lo que necesitas y haz tu pedido.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#pedido" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-viflomax-verde-700 px-6 py-3 text-sm font-bold hover:bg-viflomax-verde-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              Pedir ahora <span aria-hidden="true">↗</span>
            </a>
            <a href="#productos" className="inline-flex min-h-12 items-center justify-center rounded-full border border-viflomax-azul-300 px-6 py-3 text-sm font-bold hover:bg-viflomax-azul-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              Ver productos
            </a>
          </div>
          <p className="mt-5 text-xs leading-relaxed text-viflomax-azul-300">
            Entregamos en Maipú y Padre Hurtado.<br />Te contactamos para confirmar tu pedido.
          </p>
        </div>
        <figure className="relative m-0 grid min-w-0 place-items-center py-4 md:py-0">
          <div aria-hidden="true" className="pointer-events-none absolute h-3/4 w-full -rotate-[35deg] rounded-[50%] border border-viflomax-azul-300/20" />
          <div className="hero-imagen-entrada relative grid w-full place-items-center">
            <div className="hero-producto relative w-[220px] rounded-t-[55px] rounded-b-[20px] border border-viflomax-azul-300 shadow-xl md:w-[calc(100%-2.25rem)] md:max-w-[360px] md:rounded-t-[90px] md:rounded-b-[28px]">
              <div aria-hidden="true" className="pointer-events-none absolute -inset-3 -z-10 rotate-[7deg] rounded-[inherit] border border-viflomax-azul-300/20" />
              <Image src={PRODUCTO_HERO.imagen ?? '/logo.png'} alt={PRODUCTO_HERO.nombre} width={1080} height={1350} priority sizes="(max-width: 767px) 220px, 360px" className="h-auto w-full rounded-[inherit]" />
              <div aria-hidden="true" className="hero-reflejo pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" />
            </div>
            <figcaption className="absolute bottom-6 right-0 rounded-2xl border border-viflomax-azul-300 bg-viflomax-azul-800 px-4 py-3 text-[10px] md:bottom-10 md:text-xs">
              AGUA PARA TU CASA<span className="block text-xl font-extrabold md:text-2xl">20 litros</span>
            </figcaption>
          </div>
        </figure>
      </div>
      <svg aria-hidden="true" viewBox="0 0 1440 60" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-px left-0 h-10 w-full fill-white"><path d="M0 35C310 70 460 0 760 27S1170 67 1440 25V60H0Z" /></svg>
    </section>
  )
}
