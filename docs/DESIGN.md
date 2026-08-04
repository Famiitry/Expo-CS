# DESIGN.md

# Diseno para Smart Inventory AI Demo

Documento destinado a Stitch y a cualquier agente que implemente la experiencia visual.

## Identidad visual

- Personalidad: tecnica, confiable, ejecutiva y clara.
- Contexto: empresa electrica con operaciones de bodega y continuidad de servicio.
- Tono: sobrio y moderno, sin apariencia de ERP pesado.

## Colores

- Fondo principal: `#f6f7f9`
- Superficies: `#ffffff`
- Texto principal: `#15202b`
- Texto secundario: `#5d6b7a`
- Primario: `#0f766e`
- Acento energia: `#f5b301`
- Critico: `#dc2626`
- Advertencia: `#d97706`
- Exito: `#15803d`
- Bordes: `#d9e1e8`

## Iconografia

- Usar iconos lineales y simples.
- Priorizar iconos para tablero, bodega, alerta, transferencia, carga de archivo y explicacion.
- Evitar ilustraciones decorativas que no aporten a la demostracion.

## Componentes

- Barra superior con nombre del sistema y estado de importacion.
- Tarjetas metricas compactas para indicadores ejecutivos.
- Tabla de inventario con filtros simples.
- Tabla de alertas ordenada por criticidad.
- Lista de transferencias sugeridas con explicacion visible.
- Estado vacio claro antes de importar datos.

## Dashboard

Mostrar unicamente:

- Total materiales.
- Materiales criticos.
- Alertas.
- Transferencias sugeridas.
- Inventario por bodega.

No agregar graficos innecesarios. Si se usa visualizacion, debe ayudar a comparar bodegas rapidamente.

## Tablas

- Cabeceras fijas visualmente claras.
- Filas con buen espaciado.
- Criticidad visible mediante etiqueta de color.
- Stock critico destacado sin saturar la interfaz.

## Experiencia de usuario

- La primera pantalla debe permitir importar el Excel o ver datos de ejemplo.
- Cada recomendacion debe mostrar una explicacion corta.
- La navegacion debe ser simple y orientada a demostracion.
- La interfaz debe funcionar en escritorio y tablet.

## Pantallas

### Login

Pantalla simple de acceso demo con usuario precargado o boton de entrar. No implementar autenticacion real en la fase inicial.

### Dashboard

Vista ejecutiva con metricas, inventario por bodega, alertas principales y transferencias sugeridas.

### Inventario

Tabla consultable de materiales por codigo, material, categoria, bodega, stock y criticidad.

### Transferencias

Lista priorizada de transferencias recomendadas con origen, destino, cantidad sugerida y explicacion.

### Alertas

Listado de materiales con stock critico, ordenado por criticidad y brecha de stock.
