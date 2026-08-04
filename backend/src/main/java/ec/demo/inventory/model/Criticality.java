package ec.demo.inventory.model;

import java.util.Comparator;

public enum Criticality {
    ALTA(3),
    MEDIA(2),
    BAJA(1);

    public static final Comparator<Criticality> PRIORITY =
            Comparator.comparingInt(Criticality::priority).reversed();

    private final int priority;

    Criticality(int priority) {
        this.priority = priority;
    }

    public int priority() {
        return priority;
    }

    public static Criticality from(String value) {
        if (value == null || value.isBlank()) {
            return BAJA;
        }
        return switch (value.trim().toUpperCase()) {
            case "ALTA", "HIGH" -> ALTA;
            case "MEDIA", "MEDIUM" -> MEDIA;
            default -> BAJA;
        };
    }
}
