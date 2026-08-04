# MCP.md

# Diseno MCP

No implementar todavia como producto final. Este documento define el diseno previsto.

## Stitch MCP

Stitch puede conectarse como MCP externo para apoyar diseno y generacion visual.

Archivo de referencia:

- `stitch.mcp.json.example`

La API key debe cargarse mediante `STITCH_API_KEY`. No guardar claves reales en el repositorio.

Ejemplo de configuracion esperada:

```json
{
  "servers": {
    "stitch": {
      "type": "http",
      "url": "https://stitch.googleapis.com/mcp",
      "headers": {
        "X-Goog-Api-Key": "${STITCH_API_KEY}"
      }
    }
  }
}
```

Esta configuracion no reemplaza el MCP propio del inventario. Stitch es una herramienta externa; el servidor MCP del proyecto debe exponer capacidades del backend.

## Objetivo

Permitir que agentes IA consulten el sistema de inventario inteligente mediante herramientas MCP.

## Principio de integracion

El servidor MCP debe consumir la API del backend.

Nunca debe acceder directamente a la base de datos.

## Herramientas previstas

### consultar_material

Busca materiales por codigo o texto del nombre.

### consultar_stock

Consulta el stock actual de un material por bodega.

### consultar_stock_critico

Devuelve materiales que cumplen la regla de stock critico.

### sugerir_transferencia

Solicita una recomendacion de transferencia para un material con deficit.

### explicar_recomendacion

Devuelve la explicacion asociada a una alerta o transferencia.

## API backend prevista

- `GET /api/materials`
- `GET /api/warehouses`
- `GET /api/alerts`
- `GET /api/transfers`
- `GET /api/dashboard`
- `POST /api/import`

## Restricciones

- No exponer credenciales de base de datos al MCP.
- No modificar inventario desde MCP en la demo inicial.
- Responder con explicaciones breves y trazables.
