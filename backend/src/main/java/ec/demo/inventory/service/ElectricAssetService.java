package ec.demo.inventory.service;

import ec.demo.inventory.model.ElectricAsset;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class ElectricAssetService {
    private final List<ElectricAsset> assets = new ArrayList<>();

    @PostConstruct
    void loadDemoAssets() {
        assets.addAll(List.of(
                new ElectricAsset("TR-001", "transformador", "Transformador trifasico 75 kVA", "Subestacion Centro", 1999, "operativo con observaciones", 4, false, 25, false, "alta", List.of(
                        "2021-04-12: fuga menor de aceite",
                        "2022-09-03: sobrecalentamiento en hora pico",
                        "2024-01-18: mantenimiento correctivo",
                        "2025-11-07: disparo por proteccion"
                )),
                new ElectricAsset("TR-002", "transformador", "Transformador monofasico 25 kVA", "Alimentador Ricaurte", 2018, "operativo", 1, true, 25, false, "media", List.of(
                        "2023-05-22: inspeccion preventiva",
                        "2025-03-10: cambio de fusible asociado"
                )),
                new ElectricAsset("PO-014", "poste", "Poste de hormigon 12 m", "Circuito Paute Norte", 1997, "requiere inspeccion", 3, false, 30, false, "alta", List.of(
                        "2020-08-19: fisura superficial",
                        "2023-02-14: inclinacion reportada",
                        "2025-06-01: inspeccion visual pendiente"
                )),
                new ElectricAsset("IN-033", "interruptor", "Interruptor automatico 27 kV", "Subestacion Sur", 2012, "operativo", 0, false, 20, true, "media", List.of(
                        "2022-10-05: prueba de apertura correcta",
                        "2025-04-15: mantenimiento preventivo"
                )),
                new ElectricAsset("RC-009", "reconectador", "Reconectador automatico trifasico", "Alimentador Gualaceo", 2001, "operativo con observaciones", 5, false, 22, false, "alta", List.of(
                        "2021-01-30: reconexiones frecuentes",
                        "2022-07-11: falla de comunicacion",
                        "2024-09-08: calibracion",
                        "2025-12-12: apertura no programada"
                )),
                new ElectricAsset("MD-120", "medidor", "Medidor inteligente residencial", "Cliente demo 4812", 2022, "operativo", 0, true, 15, false, "baja", List.of(
                        "2022-02-20: instalacion",
                        "2024-08-03: lectura remota correcta"
                ))
        ));
    }

    public List<ElectricAsset> search(String tipo, Integer antiguedadMayorA, Integer fallasMinimas, Boolean sinReemplazoProgramado, String criticidad) {
        int currentYear = Year.now().getValue();
        return assets.stream()
                .filter(asset -> tipo == null || asset.tipo().equalsIgnoreCase(tipo))
                .filter(asset -> antiguedadMayorA == null || currentYear - asset.anioInstalacion() > antiguedadMayorA)
                .filter(asset -> fallasMinimas == null || asset.fallasUltimosCincoAnios() >= fallasMinimas)
                .filter(asset -> sinReemplazoProgramado == null || !sinReemplazoProgramado || !asset.reemplazoProgramado())
                .filter(asset -> criticidad == null || asset.criticidad().equalsIgnoreCase(criticidad))
                .sorted(Comparator.comparing(ElectricAsset::criticidad).thenComparing(ElectricAsset::id))
                .toList();
    }

    public Optional<ElectricAsset> find(String id) {
        return assets.stream().filter(asset -> asset.id().equalsIgnoreCase(id)).findFirst();
    }

    public ElectricAsset create(ElectricAsset asset) {
        find(asset.id()).ifPresent(existing -> {
            throw new IllegalArgumentException("Ya existe un activo con id " + asset.id());
        });
        assets.add(asset);
        return asset;
    }

    public Optional<ElectricAsset> update(String id, ElectricAsset replacement) {
        return replace(id, existing -> new ElectricAsset(
                existing.id(),
                replacement.tipo(),
                replacement.nombre(),
                replacement.ubicacion(),
                replacement.anioInstalacion(),
                replacement.estadoOperativo(),
                replacement.fallasUltimosCincoAnios(),
                replacement.garantiaVigente(),
                replacement.vidaUtilAnios(),
                replacement.reemplazoProgramado(),
                replacement.criticidad(),
                replacement.historial()
        ));
    }

    public boolean delete(String id) {
        return assets.removeIf(asset -> asset.id().equalsIgnoreCase(id));
    }

    public Optional<ElectricAsset> registerInstallation(String id, int anioInstalacion, String ubicacion) {
        return replace(id, asset -> withHistory(new ElectricAsset(
                asset.id(), asset.tipo(), asset.nombre(), ubicacion == null ? asset.ubicacion() : ubicacion,
                anioInstalacion, asset.estadoOperativo(), asset.fallasUltimosCincoAnios(),
                asset.garantiaVigente(), asset.vidaUtilAnios(), asset.reemplazoProgramado(), asset.criticidad(),
                asset.historial()
        ), "instalacion registrada en " + (ubicacion == null ? asset.ubicacion() : ubicacion)));
    }

    public Optional<ElectricAsset> retire(String id, String motivo) {
        return replace(id, asset -> withHistory(new ElectricAsset(
                asset.id(), asset.tipo(), asset.nombre(), asset.ubicacion(), asset.anioInstalacion(),
                "fuera de servicio", asset.fallasUltimosCincoAnios(), asset.garantiaVigente(),
                asset.vidaUtilAnios(), true, "alta", asset.historial()
        ), "retiro registrado. Motivo: " + motivo));
    }

    public Optional<ElectricAsset> changeLocation(String id, String nuevaUbicacion) {
        return replace(id, asset -> withHistory(new ElectricAsset(
                asset.id(), asset.tipo(), asset.nombre(), nuevaUbicacion, asset.anioInstalacion(),
                asset.estadoOperativo(), asset.fallasUltimosCincoAnios(), asset.garantiaVigente(),
                asset.vidaUtilAnios(), asset.reemplazoProgramado(), asset.criticidad(), asset.historial()
        ), "cambio de ubicacion a " + nuevaUbicacion));
    }

    public String evaluateCriticality(ElectricAsset asset) {
        int age = Year.now().getValue() - asset.anioInstalacion();
        if ((age > 20 && asset.fallasUltimosCincoAnios() >= 3 && !asset.reemplazoProgramado())
                || asset.estadoOperativo().equalsIgnoreCase("fuera de servicio")) {
            return "alta";
        }
        if (age > asset.vidaUtilAnios() * 0.75 || asset.fallasUltimosCincoAnios() >= 2) {
            return "media";
        }
        return "baja";
    }

    private Optional<ElectricAsset> replace(String id, AssetUpdater updater) {
        for (int i = 0; i < assets.size(); i++) {
            ElectricAsset asset = assets.get(i);
            if (asset.id().equalsIgnoreCase(id)) {
                ElectricAsset updated = updater.update(asset);
                assets.set(i, updated);
                return Optional.of(updated);
            }
        }
        return Optional.empty();
    }

    private ElectricAsset withHistory(ElectricAsset asset, String event) {
        List<String> history = new ArrayList<>();
        history.add(LocalDate.now() + ": " + event);
        history.addAll(asset.historial());
        return new ElectricAsset(
                asset.id(), asset.tipo(), asset.nombre(), asset.ubicacion(), asset.anioInstalacion(),
                asset.estadoOperativo(), asset.fallasUltimosCincoAnios(), asset.garantiaVigente(),
                asset.vidaUtilAnios(), asset.reemplazoProgramado(), asset.criticidad().toLowerCase(Locale.ROOT),
                history
        );
    }

    private interface AssetUpdater {
        ElectricAsset update(ElectricAsset asset);
    }
}
