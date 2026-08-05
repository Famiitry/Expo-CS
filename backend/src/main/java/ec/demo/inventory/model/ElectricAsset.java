package ec.demo.inventory.model;

import java.util.List;

public record ElectricAsset(
        String id,
        String tipo,
        String nombre,
        String ubicacion,
        int anioInstalacion,
        String estadoOperativo,
        int fallasUltimosCincoAnios,
        boolean garantiaVigente,
        int vidaUtilAnios,
        boolean reemplazoProgramado,
        String criticidad,
        List<String> historial
) {
}
