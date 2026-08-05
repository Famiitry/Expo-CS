package ec.demo.inventory.web;

import ec.demo.inventory.model.ElectricAsset;
import ec.demo.inventory.service.ElectricAssetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Year;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "*")
public class ElectricAssetController {
    private final ElectricAssetService assetService;

    public ElectricAssetController(ElectricAssetService assetService) {
        this.assetService = assetService;
    }

    @GetMapping
    public List<ElectricAsset> search(
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) Integer antiguedadMayorA,
            @RequestParam(required = false) Integer fallasMinimas,
            @RequestParam(required = false) Boolean sinReemplazoProgramado,
            @RequestParam(required = false) String criticidad
    ) {
        return assetService.search(tipo, antiguedadMayorA, fallasMinimas, sinReemplazoProgramado, criticidad);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ElectricAsset> find(@PathVariable String id) {
        return ResponseEntity.of(assetService.find(id));
    }

    @PostMapping
    public ElectricAsset create(@RequestBody ElectricAsset asset) {
        return assetService.create(asset);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ElectricAsset> update(@PathVariable String id, @RequestBody ElectricAsset asset) {
        return ResponseEntity.of(assetService.update(id, asset));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        return assetService.delete(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<Map<String, Object>> history(@PathVariable String id) {
        return assetService.find(id)
                .map(asset -> ResponseEntity.ok(Map.<String, Object>of(
                        "id", asset.id(),
                        "nombre", asset.nombre(),
                        "historial", asset.historial()
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/warranty")
    public ResponseEntity<Map<String, Object>> warranty(@PathVariable String id) {
        return assetService.find(id)
                .map(asset -> ResponseEntity.ok(Map.<String, Object>of(
                        "id", asset.id(),
                        "nombre", asset.nombre(),
                        "garantiaVigente", asset.garantiaVigente()
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/useful-life")
    public ResponseEntity<Map<String, Object>> usefulLife(@PathVariable String id) {
        return assetService.find(id)
                .map(asset -> {
                    int age = Year.now().getValue() - asset.anioInstalacion();
                    return ResponseEntity.ok(Map.<String, Object>of(
                            "id", asset.id(),
                            "nombre", asset.nombre(),
                            "edad", age,
                            "vidaUtilAnios", asset.vidaUtilAnios(),
                            "porcentajeConsumido", Math.round((age * 100.0) / asset.vidaUtilAnios()),
                            "excedeVidaUtil", age > asset.vidaUtilAnios()
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/criticality")
    public List<Map<String, Object>> criticality(@RequestParam(required = false) String id) {
        return assetService.search(null, null, null, null, null).stream()
                .filter(asset -> id == null || asset.id().equalsIgnoreCase(id))
                .map(asset -> Map.<String, Object>of(
                        "id", asset.id(),
                        "nombre", asset.nombre(),
                        "criticidadActual", asset.criticidad(),
                        "criticidadCalculada", assetService.evaluateCriticality(asset),
                        "explicacion", explain(asset)
                ))
                .toList();
    }

    @PostMapping("/{id}/installation")
    public ResponseEntity<ElectricAsset> registerInstallation(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        int year = ((Number) payload.get("anioInstalacion")).intValue();
        String location = payload.get("ubicacion") == null ? null : payload.get("ubicacion").toString();
        return ResponseEntity.of(assetService.registerInstallation(id, year, location));
    }

    @PostMapping("/{id}/retire")
    public ResponseEntity<ElectricAsset> retire(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        return ResponseEntity.of(assetService.retire(id, payload.getOrDefault("motivo", "No especificado").toString()));
    }

    @PostMapping("/{id}/location")
    public ResponseEntity<ElectricAsset> changeLocation(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        return ResponseEntity.of(assetService.changeLocation(id, payload.get("nuevaUbicacion").toString()));
    }

    private String explain(ElectricAsset asset) {
        int age = Year.now().getValue() - asset.anioInstalacion();
        if (age > 20 && asset.fallasUltimosCincoAnios() >= 3 && !asset.reemplazoProgramado()) {
            return "Tiene " + age + " años, " + asset.fallasUltimosCincoAnios() + " fallas recientes y no tiene reemplazo programado.";
        }
        if (asset.estadoOperativo().equalsIgnoreCase("fuera de servicio")) {
            return "Esta fuera de servicio y requiere accion inmediata.";
        }
        return "No supera simultaneamente los umbrales de antiguedad, fallas y reemplazo.";
    }
}
