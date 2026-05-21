-- Función para decrementar stock atómicamente (evita race condition en entregas concurrentes)
CREATE OR REPLACE FUNCTION decrementar_stock_producto(
  p_producto_id uuid,
  p_cantidad integer
)
RETURNS void AS $$
BEGIN
  UPDATE inventario
  SET stock_bodega = GREATEST(0, stock_bodega - p_cantidad),
      updated_at = now()
  WHERE producto_id = p_producto_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto % no encontrado en inventario', p_producto_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear pedido + items atómicamente (previene pedidos huérfanos)
CREATE OR REPLACE FUNCTION crear_pedido_con_items(
  p_pedido jsonb,
  p_items jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_pedido_id uuid;
  v_numero_pedido text;
  v_item jsonb;
BEGIN
  -- Insertar pedido
  INSERT INTO pedidos (
    cliente_id, empresa_id, chofer_id, fecha_entrega_programada,
    estado, origen, monto_total, notas
  )
  SELECT
    (p_pedido->>'cliente_id')::uuid,
    (p_pedido->>'empresa_id')::uuid,
    (p_pedido->>'chofer_id')::uuid,
    (p_pedido->>'fecha_entrega_programada')::date,
    COALESCE(p_pedido->>'estado', 'nuevo'),
    p_pedido->>'origen',
    (p_pedido->>'monto_total')::numeric,
    p_pedido->>'notas'
  RETURNING id, numero_pedido INTO v_pedido_id, v_numero_pedido;

  -- Insertar items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, precio_origen)
    VALUES (
      v_pedido_id,
      (v_item->>'producto_id')::uuid,
      (v_item->>'cantidad')::integer,
      (v_item->>'precio_unitario')::numeric,
      v_item->>'precio_origen'
    );
  END LOOP;

  RETURN jsonb_build_object('id', v_pedido_id, 'numero_pedido', v_numero_pedido);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
