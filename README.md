# Smart Inventory AI Demo

Demo tecnologica de gestion inteligente de inventario para una empresa electrica tipo CENTROSUR.

La aplicacion permite importar inventario desde Excel, aplicar reglas simples de stock critico, sugerir transferencias entre bodegas y explicar cada recomendacion. El alcance esta optimizado para una presentacion ejecutiva de aproximadamente 15 minutos.

## Estructura

```text
smart-inventory-demo/
  CLAUDE.md
  README.md
  docs/
  frontend/
  backend/
  mcp-server/
  sample-data/
```

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Java 21, Spring Boot, Maven
- Base de datos: PostgreSQL
- Infraestructura local: Docker Compose
- MCP: servidor de diseno inicial para exponer herramientas a agentes IA

Nota: la primera demo carga datos en memoria para que la presentacion arranque sin migraciones. PostgreSQL ya queda definido en `docker-compose.yml` para la siguiente fase de persistencia.

## Inicio rapido

1. Revisar documentacion:

```bash
docs/REQUIREMENTS.md
docs/BUSINESS_RULES.md
docs/DESIGN.md
docs/MCP.md
```

2. Levantar servicios:

```bash
docker compose up --build
```

3. Abrir frontend:

```text
http://localhost:5173
```

4. Probar backend:

```text
http://localhost:8080/api/dashboard
```

## Datos de ejemplo

El archivo base esta en:

```text
sample-data/inventario_demo.xlsx
```

Columnas esperadas:

- Codigo
- Material
- Categoria
- Bodega
- Stock actual
- Stock minimo
- Criticidad

## Alcance de demo

La prioridad es simplicidad, claridad visual y trazabilidad de las recomendaciones. No se busca construir un ERP.
