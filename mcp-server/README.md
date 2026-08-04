# MCP Server

Scaffold reservado para el servidor MCP de Smart Inventory AI Demo.

Segun `docs/MCP.md`, este componente debe consumir la API del backend y nunca acceder directamente a PostgreSQL.

Este servidor no es Stitch. Stitch se configura como MCP externo con `stitch.mcp.json.example`.

## Herramientas previstas

- `consultar_material`
- `consultar_stock`
- `consultar_stock_critico`
- `sugerir_transferencia`
- `explicar_recomendacion`

## Estado

Diseno definido, implementacion pendiente para la fase MCP.
