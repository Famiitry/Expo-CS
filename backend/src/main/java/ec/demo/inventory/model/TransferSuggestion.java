package ec.demo.inventory.model;

public record TransferSuggestion(
        String code,
        String material,
        String originWarehouse,
        String destinationWarehouse,
        int suggestedQuantity,
        Criticality criticality,
        String explanation
) {
}
