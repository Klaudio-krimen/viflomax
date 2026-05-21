import { calcularPrecioItem } from './calcular'
import { createClient } from '@/lib/supabase/server'

// Mock completo de createClient
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

/**
 * Helper que construye un mock del Supabase query builder.
 * Cada método retorna `this` para soportar el chaining;
 * al final `.single()` y la resolución de la query retornan { data, error }.
 */
function buildSupabaseMock(responses: Record<string, { data: unknown; error: null }>) {
  // Estado interno: tabla actual
  let currentTable = ''

  const builder: Record<string, jest.Mock> = {}

  const chainMethods = ['select', 'eq', 'lte', 'or', 'order', 'is'] as const

  // Resolución de la query (await builder retorna { data, error })
  const makeResolvable = (tableName: string) => {
    const obj = {
      then(resolve: (v: unknown) => void) {
        resolve(responses[tableName] ?? { data: null, error: null })
      },
    }
    return obj
  }

  const queryBuilder: Record<string, unknown> = {}

  for (const method of chainMethods) {
    queryBuilder[method] = jest.fn(() => queryBuilder)
  }

  // single() retorna una promesa directamente
  queryBuilder['single'] = jest.fn(() => {
    return Promise.resolve(responses[currentTable] ?? { data: null, error: null })
  })

  // Hacer que el query builder sea thenable (await queryBuilder → data)
  queryBuilder['then'] = (resolve: (v: unknown) => void) => {
    resolve(responses[currentTable] ?? { data: null, error: null })
  }

  const from = jest.fn((table: string) => {
    currentTable = table
    return queryBuilder
  })

  return { from, queryBuilder }
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('calcularPrecioItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── Test 1: Precio mayorista — tramo correcto ──────────────────────────────
  it('1. mayorista — retorna el tramo correcto para cantidad 15 (tramo 11+)', async () => {
    const tramosData = [
      // Ordenados por volumen_minimo DESC (Supabase los devuelve así)
      { id: '2', empresa_id: 'emp1', producto_id: 'prod1', volumen_minimo: 11, volumen_maximo: null, precio: 1900, vigente_desde: '2024-01-01', vigente_hasta: null },
      { id: '1', empresa_id: 'emp1', producto_id: 'prod1', volumen_minimo: 1, volumen_maximo: 10, precio: 2200, vigente_desde: '2024-01-01', vigente_hasta: null },
    ]

    const { from } = buildSupabaseMock({
      precios_mayorista: { data: tramosData, error: null },
    })

    mockCreateClient.mockResolvedValue({ from } as never)

    const result = await calcularPrecioItem({
      productoId: 'prod1',
      cantidad: 15,
      clienteTipo: 'mayorista',
      empresaId: 'emp1',
    })

    expect(result.precio).toBe(1900)
    expect(result.origen).toBe('mayorista')
    expect(result.tramo_aplicado).toBe('11+ unidades')
  })

  // ── Test 2: Precio mayorista — sin tramos → cae a precio base ─────────────
  it('2. mayorista — sin tramos registrados cae al precio base del producto', async () => {
    const { from, queryBuilder } = buildSupabaseMock({
      precios_mayorista: { data: [], error: null },
      productos: { data: { precio_base: 2500 }, error: null },
    })

    // single() en la tabla productos debe retornar precio_base
    queryBuilder['single'] = jest.fn(() =>
      Promise.resolve({ data: { precio_base: 2500 }, error: null })
    )

    mockCreateClient.mockResolvedValue({ from } as never)

    const result = await calcularPrecioItem({
      productoId: 'prod1',
      cantidad: 5,
      clienteTipo: 'mayorista',
      empresaId: 'emp1',
    })

    expect(result.precio).toBe(2500)
    expect(result.origen).toBe('base')
    expect(result.tramo_aplicado).toBeUndefined()
  })

  // ── Test 3: Precio detalle con sector ─────────────────────────────────────
  it('3. detalle con sector — retorna precio del sector, origen detalle_sector', async () => {
    const tramosData = [
      { id: '1', producto_id: 'prod1', sector: 'centro', cantidad_minima: 1, cantidad_maxima: null, precio: 2500, vigente_desde: '2024-01-01', vigente_hasta: null },
    ]

    const { from } = buildSupabaseMock({
      precios_detalle: { data: tramosData, error: null },
    })

    mockCreateClient.mockResolvedValue({ from } as never)

    const result = await calcularPrecioItem({
      productoId: 'prod1',
      cantidad: 3,
      clienteTipo: 'detalle',
      sector: 'centro',
    })

    expect(result.precio).toBe(2500)
    expect(result.origen).toBe('detalle_sector')
    expect(result.tramo_aplicado).toBe('1+ unidades')
  })

  // ── Test 4: Precio detalle sin sector (genérico) ──────────────────────────
  it('4. detalle sin sector — busca precio genérico (sector null)', async () => {
    const tramosData = [
      { id: '1', producto_id: 'prod1', sector: null, cantidad_minima: 1, cantidad_maxima: null, precio: 2300, vigente_desde: '2024-01-01', vigente_hasta: null },
    ]

    const { from } = buildSupabaseMock({
      precios_detalle: { data: tramosData, error: null },
    })

    mockCreateClient.mockResolvedValue({ from } as never)

    const result = await calcularPrecioItem({
      productoId: 'prod1',
      cantidad: 2,
      clienteTipo: 'detalle',
      // sin sector
    })

    expect(result.precio).toBe(2300)
    // sector null → origen 'base' según implementación
    expect(result.origen).toBe('base')
  })

  // ── Test 5: Fallback a precio base ────────────────────────────────────────
  it('5. fallback — sin precios en ninguna tabla retorna precio_base del producto', async () => {
    let callCount = 0

    const queryBuilder: Record<string, unknown> = {}
    const chainMethods = ['select', 'eq', 'lte', 'or', 'order', 'is']
    for (const method of chainMethods) {
      queryBuilder[method] = jest.fn(() => queryBuilder)
    }

    // precios_detalle retorna vacío; productos retorna precio_base
    queryBuilder['single'] = jest.fn(() =>
      Promise.resolve({ data: { precio_base: 1800 }, error: null })
    )
    queryBuilder['then'] = (resolve: (v: unknown) => void) => {
      callCount++
      // primera y segunda llamada son a precios_detalle (con sector y sin sector)
      resolve({ data: [], error: null })
    }

    const from = jest.fn(() => queryBuilder)
    mockCreateClient.mockResolvedValue({ from } as never)

    const result = await calcularPrecioItem({
      productoId: 'prod1',
      cantidad: 5,
      clienteTipo: 'detalle',
      sector: 'norte',
    })

    expect(result.precio).toBe(1800)
    expect(result.origen).toBe('base')
  })

  // ── Test 6: Sin precio registrado → precio 0, origen sin_precio ───────────
  it('6. sin precio registrado — retorna precio 0 y origen sin_precio', async () => {
    const queryBuilder: Record<string, unknown> = {}
    const chainMethods = ['select', 'eq', 'lte', 'or', 'order', 'is']
    for (const method of chainMethods) {
      queryBuilder[method] = jest.fn(() => queryBuilder)
    }

    // productos.single() retorna producto sin precio_base
    queryBuilder['single'] = jest.fn(() =>
      Promise.resolve({ data: { precio_base: null }, error: null })
    )
    queryBuilder['then'] = (resolve: (v: unknown) => void) => {
      resolve({ data: [], error: null })
    }

    const from = jest.fn(() => queryBuilder)
    mockCreateClient.mockResolvedValue({ from } as never)

    const result = await calcularPrecioItem({
      productoId: 'prod1',
      cantidad: 5,
      clienteTipo: 'detalle',
    })

    expect(result.precio).toBe(0)
    expect(result.origen).toBe('sin_precio')
  })

  // ── Test 7: Cliente nuevo mapeado a detalle — usa precio genérico ─────────
  it('7. cliente nuevo mapeado a detalle — usa precio genérico sin sector', async () => {
    const tramosData = [
      { id: '1', producto_id: 'prod1', sector: null, cantidad_minima: 1, cantidad_maxima: 5, precio: 2100, vigente_desde: '2024-01-01', vigente_hasta: null },
    ]

    const { from } = buildSupabaseMock({
      precios_detalle: { data: tramosData, error: null },
    })

    mockCreateClient.mockResolvedValue({ from } as never)

    // clienteTipo 'nuevo' debe pasarse como 'detalle' según los tipos
    const result = await calcularPrecioItem({
      productoId: 'prod1',
      cantidad: 3,
      clienteTipo: 'detalle', // cliente nuevo se mapea a detalle
    })

    expect(result.precio).toBe(2100)
    expect(result.origen).toBe('base') // sector null → 'base'
    expect(result.tramo_aplicado).toBe('1-5 unidades')
  })

  // ── Test 8: Vigencia — precio vencido no se aplica ────────────────────────
  it('8. vigencia — precio con vigente_hasta en el pasado no aplica (mock retorna [])', async () => {
    // Simula que la query de Supabase (con filtro de fecha) retorna [] porque
    // el precio expiró. El motor cae al precio base del producto.
    const queryBuilder: Record<string, unknown> = {}
    const chainMethods = ['select', 'eq', 'lte', 'or', 'order', 'is']
    for (const method of chainMethods) {
      queryBuilder[method] = jest.fn(() => queryBuilder)
    }

    queryBuilder['single'] = jest.fn(() =>
      Promise.resolve({ data: { precio_base: 1500 }, error: null })
    )

    // precios_detalle retorna [] porque vigente_hasta ya pasó
    queryBuilder['then'] = (resolve: (v: unknown) => void) => {
      resolve({ data: [], error: null })
    }

    const from = jest.fn(() => queryBuilder)
    mockCreateClient.mockResolvedValue({ from } as never)

    const result = await calcularPrecioItem({
      productoId: 'prod1',
      cantidad: 3,
      clienteTipo: 'detalle',
      sector: 'sur',
    })

    // Al no encontrar precios vigentes, debe caer al precio_base
    expect(result.precio).toBe(1500)
    expect(result.origen).toBe('base')
  })
})
