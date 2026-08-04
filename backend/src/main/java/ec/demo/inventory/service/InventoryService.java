package ec.demo.inventory.service;

import ec.demo.inventory.model.Criticality;
import ec.demo.inventory.model.DashboardSummary;
import ec.demo.inventory.model.InventoryItem;
import ec.demo.inventory.model.StockAlert;
import ec.demo.inventory.model.TransferSuggestion;
import jakarta.annotation.PostConstruct;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InventoryService {
    private final List<InventoryItem> items = new ArrayList<>();

    @PostConstruct
    void loadDemoData() {
        replaceInventory(List.of(
                new InventoryItem("MAT-001", "Transformador monofasico 25 kVA", "Transformadores", "Cuenca Norte", 2, 5, Criticality.ALTA),
                new InventoryItem("MAT-001", "Transformador monofasico 25 kVA", "Transformadores", "Gualaceo", 12, 5, Criticality.ALTA),
                new InventoryItem("MAT-002", "Cable aluminio 1/0 AWG", "Conductores", "Cuenca Sur", 80, 100, Criticality.MEDIA),
                new InventoryItem("MAT-002", "Cable aluminio 1/0 AWG", "Conductores", "Paute", 160, 100, Criticality.MEDIA),
                new InventoryItem("MAT-003", "Medidor residencial inteligente", "Medicion", "Cuenca Norte", 35, 25, Criticality.MEDIA),
                new InventoryItem("MAT-004", "Fusible tipo K 15A", "Proteccion", "Sigsig", 4, 20, Criticality.ALTA),
                new InventoryItem("MAT-004", "Fusible tipo K 15A", "Proteccion", "Cuenca Sur", 42, 20, Criticality.ALTA),
                new InventoryItem("MAT-005", "Poste de hormigon 12 m", "Estructuras", "Paute", 7, 10, Criticality.BAJA),
                new InventoryItem("MAT-006", "Cruceta galvanizada", "Estructuras", "Gualaceo", 26, 15, Criticality.BAJA)
        ));
    }

    public List<InventoryItem> allItems() {
        return List.copyOf(items);
    }

    public List<String> warehouses() {
        return items.stream()
                .map(InventoryItem::warehouse)
                .distinct()
                .sorted()
                .toList();
    }

    public List<StockAlert> alerts() {
        return items.stream()
                .filter(InventoryItem::isCritical)
                .sorted(alertPriority())
                .map(item -> new StockAlert(
                        item.code(),
                        item.material(),
                        item.warehouse(),
                        item.currentStock(),
                        item.minimumStock(),
                        item.deficit(),
                        item.criticality(),
                        "Stock actual " + item.currentStock() + " <= minimo " + item.minimumStock()
                                + "; se genera alerta por criticidad " + item.criticality().name().toLowerCase(Locale.ROOT) + "."
                ))
                .toList();
    }

    public List<TransferSuggestion> transfers() {
        List<TransferSuggestion> suggestions = new ArrayList<>();
        for (InventoryItem deficitItem : items.stream().filter(InventoryItem::isCritical).toList()) {
            items.stream()
                    .filter(candidate -> candidate.code().equals(deficitItem.code()))
                    .filter(candidate -> !candidate.warehouse().equals(deficitItem.warehouse()))
                    .filter(candidate -> candidate.availableForTransfer() > 0)
                    .max(Comparator.comparingInt(InventoryItem::availableForTransfer))
                    .ifPresent(origin -> {
                        int quantity = Math.min(deficitItem.deficit() + 1, origin.availableForTransfer());
                        suggestions.add(new TransferSuggestion(
                                deficitItem.code(),
                                deficitItem.material(),
                                origin.warehouse(),
                                deficitItem.warehouse(),
                                quantity,
                                deficitItem.criticality(),
                                "La bodega " + deficitItem.warehouse() + " esta bajo minimo y "
                                        + origin.warehouse() + " tiene " + origin.availableForTransfer()
                                        + " unidades disponibles sobre su minimo."
                        ));
                    });
        }
        return suggestions.stream()
                .sorted(Comparator.comparing(TransferSuggestion::criticality, Criticality.PRIORITY)
                        .thenComparing(TransferSuggestion::material))
                .toList();
    }

    public DashboardSummary dashboard() {
        Map<String, Integer> byWarehouse = items.stream()
                .collect(Collectors.groupingBy(
                        InventoryItem::warehouse,
                        LinkedHashMap::new,
                        Collectors.summingInt(InventoryItem::currentStock)
                ));
        List<StockAlert> alertList = alerts();
        List<TransferSuggestion> transferList = transfers();
        return new DashboardSummary(
                items.size(),
                alertList.size(),
                alertList.size(),
                transferList.size(),
                byWarehouse,
                alertList.stream().limit(5).toList(),
                transferList.stream().limit(5).toList()
        );
    }

    public void importExcel(MultipartFile file) {
        try (InputStream input = file.getInputStream(); var workbook = WorkbookFactory.create(input)) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();
            List<InventoryItem> imported = new ArrayList<>();
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || formatter.formatCellValue(row.getCell(0)).isBlank()) {
                    continue;
                }
                imported.add(new InventoryItem(
                        formatter.formatCellValue(row.getCell(0)),
                        formatter.formatCellValue(row.getCell(1)),
                        formatter.formatCellValue(row.getCell(2)),
                        formatter.formatCellValue(row.getCell(3)),
                        parseInt(formatter.formatCellValue(row.getCell(4))),
                        parseInt(formatter.formatCellValue(row.getCell(5))),
                        Criticality.from(formatter.formatCellValue(row.getCell(6)))
                ));
            }
            replaceInventory(imported);
        } catch (Exception error) {
            throw new IllegalArgumentException("No se pudo procesar el Excel: " + error.getMessage(), error);
        }
    }

    private void replaceInventory(List<InventoryItem> newItems) {
        items.clear();
        items.addAll(newItems);
    }

    private int parseInt(String value) {
        return Integer.parseInt(value.replace(".0", "").trim());
    }

    private Comparator<InventoryItem> alertPriority() {
        return Comparator.comparing(InventoryItem::criticality, Criticality.PRIORITY)
                .thenComparing(InventoryItem::deficit, Comparator.reverseOrder())
                .thenComparing(InventoryItem::material);
    }
}
