package ec.demo.inventory.web;

import ec.demo.inventory.model.DashboardSummary;
import ec.demo.inventory.model.InventoryItem;
import ec.demo.inventory.model.StockAlert;
import ec.demo.inventory.model.TransferSuggestion;
import ec.demo.inventory.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class InventoryController {
    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/materials")
    public List<InventoryItem> materials() {
        return inventoryService.allItems();
    }

    @GetMapping("/warehouses")
    public List<String> warehouses() {
        return inventoryService.warehouses();
    }

    @GetMapping("/alerts")
    public List<StockAlert> alerts() {
        return inventoryService.alerts();
    }

    @GetMapping("/transfers")
    public List<TransferSuggestion> transfers() {
        return inventoryService.transfers();
    }

    @GetMapping("/dashboard")
    public DashboardSummary dashboard() {
        return inventoryService.dashboard();
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importExcel(@RequestParam("file") MultipartFile file) {
        inventoryService.importExcel(file);
        return ResponseEntity.ok(Map.of(
                "message", "Inventario importado correctamente",
                "dashboard", inventoryService.dashboard()
        ));
    }
}
