# CLAUDE.md

# Smart Inventory AI Demo

Este archivo coordina el trabajo del proyecto. No duplica requisitos, reglas de negocio, diseno visual ni contrato MCP; solo indica donde consultarlos y como mantener consistencia.

## Documentos fuente

- Requisitos: `docs/REQUIREMENTS.md`
- Reglas de negocio: `docs/BUSINESS_RULES.md`
- Diseno y experiencia: `docs/DESIGN.md`
- Diseno MCP: `docs/MCP.md`

## Flujo de trabajo

1. Leer este archivo antes de modificar el proyecto.
2. Consultar el documento especifico segun el area que se vaya a tocar.
3. Implementar solo capacidades que aporten valor visible a una demostracion de 15 minutos.
4. Evitar requisitos inventados. Si algo no aparece en la documentacion, proponerlo antes de implementarlo.
5. Mantener backend, frontend y MCP alineados con los mismos nombres de dominio: material, bodega, stock, alerta, transferencia y recomendacion.
6. Al cambiar comportamiento funcional, actualizar primero los documentos afectados y luego el código.

## Criterios de consistencia

- El Excel original nunca se modifica.
- Toda recomendacion visible debe tener explicacion.
- Las reglas automaticas deben ser simples, trazables y demostrables.
- El servidor MCP consume la API del backend; no accede a PostgreSQL directamente.
- La UI prioriza claridad ejecutiva sobre densidad funcional.

## Orden recomendado de desarrollo

1. Documentacion base.
2. Backend con API y reglas.
3. Frontend con dashboard e importacion.
4. Procesamiento de Excel.
5. Automatizaciones.
6. Servidor MCP.
7. Guion de demostracion.
