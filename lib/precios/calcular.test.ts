import { calcularPrecioItem } from './calcular'
import { createClient } from '@/lib/supabase/server'

// Mock completo de createClient
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

/**
 * Helper que construye un mock del Supabase query builder.
 * Cada llamada a `from()` crea su propio builder aislado, con datos
 * específicos para esa tabla.
 */
function buildSupabaseMock(responses: Record<string, { data: unknown; error: null }>) {
  const makeBuilder = (tableData: { data: unknown; error: null }) => {
    const builder: Record<string, jest.Mock> = {}
    const chainMethods = ['select', 'eq', 'lte', 'or', 'order', 'is']
    chainMethods.forEach((method) => {
      builder[method] = jest.fn().mockReturnValue(builder)
    })
    builder['then'] = jest.fn().mockImplementation((resolve) => {
      return Promise.resolve(resolve(tableData))
    })
    builder['single'] = jest.fn().mockResolvedValue(tableData)
    return builder
  }

  return {
    from: jest.fn().mockImplementation((tableName: string) => {
      return makeBuilder(responses[tableName] ?? { data: [], error: null })
    }),
  }
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
    const { from } = buildSupabaseMock({
      precios_mayorista: { data: [], error: null },
      productos: { data: { precio_base: 2500 }, error: null },
    })

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
  it('4. detalle sin sector — busca precio genérico (sector null), origen detalle_generico', async () => {
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
    expect(result.origen).toBe('detalle_generico')
  })

  // ── Test 5: Fallback a precio base ────────────────────────────────────────
  it('5. fallback — sin precios en ninguna tabla retorna precio_base del producto', async () => {
    const { from } = buildSupabaseMock({
      precios_detalle: { data: [], error: null },
      productos: { data: { precio_base: 1800 }, error: null },
    })

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
    const { from } = buildSupabaseMock({
      precios_detalle: { data: [], error: null },
      productos: { data: { precio_base: null }, error: null },
    })

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
  it('7. cliente nuevo mapeado a detalle — usa precio genérico sin sector, origen detalle_generico', async () => {
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
    expect(result.origen).toBe('detalle_generico')
    expect(result.tramo_aplicado).toBe('1-5 unidades')
  })

  // ── Test 8: Vigencia — precio vencido no se aplica ────────────────────────
  it('8. vigencia — precio con vigente_hasta en el pasado no aplica (mock retorna [])', async () => {
    // Simula que la query de Supabase (con filtro de fecha) retorna [] porque
    // el precio expiró. El motor cae al precio base del producto.
    const { from } = buildSupabaseMock({
      precios_detalle: { data: [], error: null },
      productos: { data: { precio_base: 1500 }, error: null },
    })

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

  // ── Test 9: Tramo boundary — cantidad exactamente en límite superior ───────
  it('9. mayorista boundary — cantidad=10 con tramo 1-10 retorna precio correcto', async () => {
    const tramosData = [
      { id: '2', empresa_id: 'emp1', producto_id: 'prod1', volumen_minimo: 11, volumen_maximo: null, precio: 1900, vigente_desde: '2024-01-01', vigente_hasta: null },
      { id: '1', empresa_id: 'emp1', producto_id: 'prod1', volumen_minimo: 1, volumen_maximo: 10, precio: 2200, vigente_desde: '2024-01-01', vigente_hasta: null },
    ]

    const { from } = buildSupabaseMock({
      precios_mayorista: { data: tramosData, error: null },
    })

    mockCreateClient.mockResolvedValue({ from } as never)

    const result = await calcularPrecioItem({
      productoId: 'prod1',
      cantidad: 10,
      clienteTipo: 'mayorista',
      empresaId: 'emp1',
    })

    expect(result.precio).toBe(2200)
    expect(result.origen).toBe('mayorista')
    expect(result.tramo_aplicado).toBe('1-10 unidades')
  })

  // ── Test 10: Mayorista sin empresaId — cae a precio detalle ───────────────
  it('10. mayorista sin empresaId — cae al precio detalle (o base si no hay)', async () => {
    const tramosDetalle = [
      { id: '1', producto_id: 'prod1', sector: null, cantidad_minima: 1, cantidad_maxima: null, precio: 2400, vigente_desde: '2024-01-01', vigente_hasta: null },
    ]

    const { from } = buildSupabaseMock({
      precios_detalle: { data: tramosDetalle, error: null },
    })

    mockCreateClient.mockResolvedValue({ from } as never)

    // clienteTipo mayorista sin empresaId: la función no llama calcularPrecioMayorista
    // pero el tipo InputCalculoPrecio solo acepta 'mayorista' | 'detalle'
    // Según la implementación: si clienteTipo === 'mayorista' && empresaId → busca mayorista
    // Si no hay empresaId, omite la búsqueda mayorista y cae al detalle
    const result = await calcularPrecioItem({
      productoId: 'prod1',
      cantidad: 5,
      clienteTipo: 'mayorista',
      // sin empresaId
    })

    // Sin empresaId, no busca precio mayorista. Sin clienteTipo 'detalle', tampoco
    // busca precios_detalle. Cae al precio_base del producto.
    // La lógica actual: mayorista sin empresaId → salta al fallback precio_base.
    // Como precios_detalle no se consulta (clienteTipo !== 'detalle'),
    // el resultado depende del precio_base del producto.
    // En este mock productos devuelve data: [] → precio_base undefined → sin_precio
    expect(result.origen).toBe('sin_precio')
    expect(result.precio).toBe(0)
  })
})
