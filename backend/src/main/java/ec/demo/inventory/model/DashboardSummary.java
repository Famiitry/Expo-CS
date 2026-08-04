package ec.demo.inventory.model;

import java.util.List;
import java.util.Map;

public record DashboardSummary(
        int totalMaterials,
        int criticalMaterials,
        int alerts,
        int transferSuggestions,
        Map<String, Integer> inventoryByWarehouse,
        List<StockAlert> topAlerts,
        List<TransferSuggestion> topTransfers
) {
}
