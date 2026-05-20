/**
 * Tipos autogenerados de Supabase (esquema de base de datos)
 *
 * Estos tipos reflejan la estructura de la base de datos en Supabase.
 * Se utilizan para type-safety en los clientes de Supabase.
 *
 * Para regenerar estos tipos, usa:
 * npx supabase gen types typescript --schema public > lib/types/database.ts
 */

export type Database = {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string
          razon_social: string
          rut: string | null
          contacto: string | null
          telefono: string | null
          email: string | null
          direccion: string | null
          activo: boolean
          notas_comerciales: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          razon_social: string
          rut?: string | null
          contacto?: string | null
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          activo?: boolean
          notas_comerciales?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          razon_social?: string
          rut?: string | null
          contacto?: string | null
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          activo?: boolean
          notas_comerciales?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clientes: {
        Row: {
          id: string
          nombre: string
          telefono: string | null
          email: string | null
          direccion: string | null
          comuna: string | null
          sector: string | null
          tipo_cliente: string
          empresa_id: string | null
          activo: boolean
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          comuna?: string | null
          sector?: string | null
          tipo_cliente?: string
          empresa_id?: string | null
          activo?: boolean
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          comuna?: string | null
          sector?: string | null
          tipo_cliente?: string
          empresa_id?: string | null
          activo?: boolean
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      productos: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          presentacion: string
          precio_unitario: number
          stock: number
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          presentacion: string
          precio_unitario: number
          stock?: number
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          presentacion?: string
          precio_unitario?: number
          stock?: number
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      choferes: {
        Row: {
          id: string
          nombre: string
          rut: string | null
          licencia: string | null
          telefono: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          rut?: string | null
          licencia?: string | null
          telefono?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          rut?: string | null
          licencia?: string | null
          telefono?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      pedidos: {
        Row: {
          id: string
          cliente_id: string | null
          empresa_id: string | null
          chofer_id: string | null
          fecha_creacion: string
          fecha_entrega_programada: string | null
          origen: string
          estado: string
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente_id?: string | null
          empresa_id?: string | null
          chofer_id?: string | null
          fecha_creacion?: string
          fecha_entrega_programada?: string | null
          origen: string
          estado?: string
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string | null
          empresa_id?: string | null
          chofer_id?: string | null
          fecha_creacion?: string
          fecha_entrega_programada?: string | null
          origen?: string
          estado?: string
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pedidos_items: {
        Row: {
          id: string
          pedido_id: string
          producto_id: string
          cantidad: number
          precio_unitario: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          pedido_id: string
          producto_id: string
          cantidad: number
          precio_unitario: number
          subtotal: number
          created_at?: string
        }
        Update: {
          id?: string
          pedido_id?: string
          producto_id?: string
          cantidad?: number
          precio_unitario?: number
          subtotal?: number
          created_at?: string
        }
      }
      entregas: {
        Row: {
          id: string
          pedido_id: string
          chofer_id: string
          fecha_entrega: string
          latitud: number | null
          longitud: number | null
          bidones_vacios_recibidos: number
          monto_cobrado: number
          metodo_pago: string
          observaciones: string | null
          foto_url: string | null
          estado: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pedido_id: string
          chofer_id: string
          fecha_entrega?: string
          latitud?: number | null
          longitud?: number | null
          bidones_vacios_recibidos?: number
          monto_cobrado: number
          metodo_pago: string
          observaciones?: string | null
          foto_url?: string | null
          estado?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pedido_id?: string
          chofer_id?: string
          fecha_entrega?: string
          latitud?: number | null
          longitud?: number | null
          bidones_vacios_recibidos?: number
          monto_cobrado?: number
          metodo_pago?: string
          observaciones?: string | null
          foto_url?: string | null
          estado?: string
          created_at?: string
          updated_at?: string
        }
      }
      tramos_precio: {
        Row: {
          id: string
          producto_id: string
          cantidad_minima: number
          cantidad_maxima: number | null
          precio_unitario: number
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          producto_id: string
          cantidad_minima: number
          cantidad_maxima?: number | null
          precio_unitario: number
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          producto_id?: string
          cantidad_minima?: number
          cantidad_maxima?: number | null
          precio_unitario?: number
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
