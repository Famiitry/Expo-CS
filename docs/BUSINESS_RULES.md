# BUSINESS_RULES.md

# Reglas de negocio

## BR-001

No permitir stock negativo.

## BR-002

Si `stock actual <= stock minimo`, generar alerta.

## BR-003

Si otra bodega tiene disponibilidad, sugerir transferencia.

## BR-004

No modificar el Excel original.

## BR-005

Toda recomendacion debe explicar por que fue generada.

## BR-006

Priorizar alertas y transferencias por criticidad en este orden: Alta, Media, Baja.
