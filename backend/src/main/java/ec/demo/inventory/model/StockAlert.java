package ec.demo.inventory.model;

public record StockAlert(
        String code,
        String material,
        String warehouse,
        int currentStock,
        int minimumStock,
        int deficit,
        Criticality criticality,
        String explanation
) {
}
