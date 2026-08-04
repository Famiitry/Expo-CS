package ec.demo.inventory.model;

public record InventoryItem(
        String code,
        String material,
        String category,
        String warehouse,
        int currentStock,
        int minimumStock,
        Criticality criticality
) {
    public InventoryItem {
        if (currentStock < 0) {
            throw new IllegalArgumentException("El stock no puede ser negativo");
        }
        if (minimumStock < 0) {
            throw new IllegalArgumentException("El stock minimo no puede ser negativo");
        }
    }

    public boolean isCritical() {
        return currentStock <= minimumStock;
    }

    public int deficit() {
        return Math.max(0, minimumStock - currentStock);
    }

    public int availableForTransfer() {
        return Math.max(0, currentStock - minimumStock);
    }
}
