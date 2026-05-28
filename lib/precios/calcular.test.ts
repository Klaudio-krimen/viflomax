import { calcularPrecioItem } from './calcular'
import { db } from '@/lib/db'

// Mock del cliente Prisma
jest.mock('@/lib/db', () => ({
  db: {
    precioMayorista: { findMany: jest.fn() },
    precioDetalle: { findMany: jest.fn() },
    producto: { findUnique: jest.fn() },
  },
}))

const mockFindManyMayorista = db.precioMayorista.findMany as jest.Mock
const mockFindManyDetalle = db.precioDetalle.findMany as jest.Mock
const mockFindUniqueProducto = db.producto.findUnique as jest.Mock

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('calcularPrecioItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Defaults: sin precios registrados, sin producto
    mockFindManyMayorista.mockResolvedValue([])
    mockFindManyDetalle.mockResolvedValue([])
    mockFindUniqueProducto.mockResolvedValue(null)
  })

  // ── Test 1: Precio mayorista — tramo correcto ──────────────────────────────
  it('1. mayorista — retorna el tramo correcto para cantidad 15 (tramo 11+)', async () => {
    const tramosData = [
      // Ordenados por volumen_minimo DESC (como hace Prisma con orderBy)
      { id: '2', empresa_id: 'emp1', producto_id: 'prod1', volumen_minimo: 11, volumen_maximo: null, precio: 1900 },
      { id: '1', empresa_id: 'emp1', producto_id: 'prod1', volumen_minimo: 1, volumen_maximo: 10, precio: 2200 },
    ]
    mockFindManyMayorista.mockResolvedValue(tramosData)

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
    mockFindManyMayorista.mockResolvedValue([])
    mockFindUniqueProducto.mockResolvedValue({ precio_base: 2500 })

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
      { id: '1', producto_id: 'prod1', sector: 'centro', cantidad_minima: 1, cantidad_maxima: null, precio: 2500 },
    ]
    mockFindManyDetalle.mockResolvedValue(tramosData)

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
      { id: '1', producto_id: 'prod1', sector: null, cantidad_minima: 1, cantidad_maxima: null, precio: 2300 },
    ]
    mockFindManyDetalle.mockResolvedValue(tramosData)

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
    mockFindManyDetalle.mockResolvedValue([])
    mockFindUniqueProducto.mockResolvedValue({ precio_base: 1800 })

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
    mockFindManyDetalle.mockResolvedValue([])
    mockFindUniqueProducto.mockResolvedValue({ precio_base: null })

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
      { id: '1', producto_id: 'prod1', sector: null, cantidad_minima: 1, cantidad_maxima: 5, precio: 2100 },
    ]
    mockFindManyDetalle.mockResolvedValue(tramosData)

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
    // Simula que la query de Prisma (con filtro de fecha) retorna [] porque
    // el precio expiró. El motor cae al precio base del producto.
    mockFindManyDetalle.mockResolvedValue([])
    mockFindUniqueProducto.mockResolvedValue({ precio_base: 1500 })

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
      { id: '2', empresa_id: 'emp1', producto_id: 'prod1', volumen_minimo: 11, volumen_maximo: null, precio: 1900 },
      { id: '1', empresa_id: 'emp1', producto_id: 'prod1', volumen_minimo: 1, volumen_maximo: 10, precio: 2200 },
    ]
    mockFindManyMayorista.mockResolvedValue(tramosData)

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

  // ── Test 10: Mayorista sin empresaId — cae al precio base ─────────────────
  it('10. mayorista sin empresaId — sin empresaId no busca precios, cae al precio_base', async () => {
    // Sin empresaId, calcular.ts omite la búsqueda mayorista y detalle
    // (clienteTipo 'mayorista' sin empresaId salta al fallback precio_base)
    mockFindUniqueProducto.mockResolvedValue(null) // sin producto → sin_precio

    const result = await calcularPrecioItem({
      productoId: 'prod1',
      cantidad: 5,
      clienteTipo: 'mayorista',
      // sin empresaId
    })

    // Sin empresaId, no busca precio mayorista.
    // clienteTipo !== 'detalle', no busca precios_detalle.
    // Producto no encontrado → sin_precio
    expect(result.origen).toBe('sin_precio')
    expect(result.precio).toBe(0)
  })
})
