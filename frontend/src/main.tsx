import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  ArrowRightLeft,
  Bell,
  Boxes,
  Building2,
  ChevronRight,
  FileSpreadsheet,
  LayoutDashboard,
  LogIn,
  LogOut,
  RadioTower,
  Search,
  ShieldCheck,
  Upload
} from "lucide-react";
import "./styles.css";

type Criticality = "ALTA" | "MEDIA" | "BAJA";

type InventoryItem = {
  code: string;
  material: string;
  category: string;
  warehouse: string;
  currentStock: number;
  minimumStock: number;
  criticality: Criticality;
};

type StockAlert = {
  code: string;
  material: string;
  warehouse: string;
  currentStock: number;
  minimumStock: number;
  deficit: number;
  criticality: Criticality;
  explanation: string;
};

type TransferSuggestion = {
  code: string;
  material: string;
  originWarehouse: string;
  destinationWarehouse: string;
  suggestedQuantity: number;
  criticality: Criticality;
  explanation: string;
};

type DashboardSummary = {
  totalMaterials: number;
  criticalMaterials: number;
  alerts: number;
  transferSuggestions: number;
  inventoryByWarehouse: Record<string, number>;
  topAlerts: StockAlert[];
  topTransfers: TransferSuggestion[];
};

type AssetCriticality = "alta" | "media" | "baja";

type ElectricAsset = {
  id: string;
  tipo: string;
  nombre: string;
  ubicacion: string;
  anioInstalacion: number;
  estadoOperativo: string;
  fallasUltimosCincoAnios: number;
  garantiaVigente: boolean;
  vidaUtilAnios: number;
  reemplazoProgramado: boolean;
  criticidad: AssetCriticality;
  historial: string[];
};

type AssetActionResult = {
  title: string;
  body: string;
};

type UiActionResult = {
  title: string;
  message: string;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
type View = "dashboard" | "inventory" | "transfers" | "alerts" | "assets";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [materials, setMaterials] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [transfers, setTransfers] = useState<TransferSuggestion[]>([]);
  const [assets, setAssets] = useState<ElectricAsset[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Datos demo cargados");
  const [isImporting, setIsImporting] = useState(false);
  const [inventoryAction, setInventoryAction] = useState<UiActionResult | null>(null);
  const [transferAction, setTransferAction] = useState<UiActionResult | null>(null);
  const [alertAction, setAlertAction] = useState<UiActionResult | null>(null);

  const loadData = async () => {
    const [dashboardResponse, materialsResponse, alertsResponse, transfersResponse, assetsResponse] = await Promise.all([
      fetch(`${API_BASE}/dashboard`),
      fetch(`${API_BASE}/materials`),
      fetch(`${API_BASE}/alerts`),
      fetch(`${API_BASE}/transfers`),
      fetch(`${API_BASE}/assets`)
    ]);
    setDashboard(await dashboardResponse.json());
    setMaterials(await materialsResponse.json());
    setAlerts(await alertsResponse.json());
    setTransfers(await transfersResponse.json());
    setAssets(await assetsResponse.json());
  };

  useEffect(() => {
    loadData().catch(() => setStatus("Backend no disponible"));
  }, []);

  const filteredMaterials = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return materials;
    return materials.filter((item) =>
      [item.code, item.material, item.category, item.warehouse].some((value) =>
        value.toLowerCase().includes(normalized)
      )
    );
  }, [materials, query]);

  const importExcel = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    setIsImporting(true);
    setStatus(`Importando ${file.name}...`);
    try {
      const response = await fetch(`${API_BASE}/import`, {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "No se pudo importar el Excel" }));
        setStatus(error.error ?? "No se pudo importar el Excel");
        return;
      }
      await loadData();
      setStatus(`Inventario actualizado desde ${file.name}`);
    } catch (error) {
      setStatus(error instanceof DOMException && error.name === "AbortError"
        ? "La importación tardó demasiado. Revisa el backend o intenta con otro Excel."
        : "No se pudo conectar con el backend para importar el Excel.");
    } finally {
      window.clearTimeout(timeout);
      setIsImporting(false);
    }
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><ShieldCheck size={22} /></div>
          <div>
            <strong>Smart Inventory</strong>
            <span>CENTROSUR demo</span>
          </div>
        </div>
        <nav className="nav-menu">
          <NavButton icon={<LayoutDashboard />} label="Dashboard" active={activeView === "dashboard"} onClick={() => setActiveView("dashboard")} />
          <NavButton icon={<Boxes />} label="Inventario" active={activeView === "inventory"} onClick={() => setActiveView("inventory")} />
          <NavButton icon={<ArrowRightLeft />} label="Transferencias" active={activeView === "transfers"} onClick={() => setActiveView("transfers")} />
          <NavButton icon={<Bell />} label="Alertas" active={activeView === "alerts"} onClick={() => setActiveView("alerts")} />
          <NavButton icon={<RadioTower />} label="Activos" active={activeView === "assets"} onClick={() => setActiveView("assets")} />
        </nav>
        <button className="logout-button" onClick={() => setIsLoggedIn(false)}><LogOut size={18} /> Salir</button>
      </aside>

      <main className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Gestión inteligente de inventario eléctrico</p>
            <h1>{viewTitle(activeView)}</h1>
          </div>
          <label className={`upload-button ${isImporting ? "disabled" : ""}`} title="Importar archivo Excel">
            <Upload size={18} />
            <span>{isImporting ? "Importando..." : "Importar Excel"}</span>
            <input disabled={isImporting} type="file" accept=".xlsx,.xls" onChange={(event) => event.target.files?.[0] && importExcel(event.target.files[0])} />
          </label>
        </header>

        <section className="status-strip">
          <FileSpreadsheet size={18} />
          <span>{status}</span>
        </section>

        {activeView === "dashboard" && (
          <>
            <Metrics dashboard={dashboard} />
            <section className="dashboard-grid">
              <WarehousePanel dashboard={dashboard} />
              <TransfersPanel transfers={transfers} />
            </section>
          </>
        )}

        {activeView === "inventory" && (
          <Panel title="Inventario de materiales">
            <SearchBox query={query} setQuery={setQuery} />
            <InventoryActions materials={filteredMaterials} onAction={setInventoryAction} />
            {inventoryAction && <ActionNotice title={inventoryAction.title} message={inventoryAction.message} />}
            <InventoryTable materials={filteredMaterials} />
          </Panel>
        )}

        {activeView === "transfers" && (
          <>
            <TransferActions transfers={transfers} onAction={setTransferAction} />
            {transferAction && <ActionNotice title={transferAction.title} message={transferAction.message} />}
            <TransfersPanel transfers={transfers} expanded />
          </>
        )}

        {activeView === "alerts" && (
          <>
            <AlertActions alerts={alerts} onAction={setAlertAction} />
            {alertAction && <ActionNotice title={alertAction.title} message={alertAction.message} />}
            <AlertsPanel alerts={alerts} expanded />
          </>
        )}

        {activeView === "assets" && <AssetsPanel assets={assets} onRefresh={loadData} />}
      </main>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="login-screen">
      <div className="login-stage">
        <section className="login-visual">
          <div className="brand large">
            <div className="brand-mark"><ShieldCheck size={26} /></div>
            <div>
              <strong>Smart Inventory AI</strong>
            <span>Empresa eléctrica demo</span>
            </div>
          </div>
          <h1>Inventario critico con recomendaciones explicables.</h1>
          <div className="login-kpis">
            <span>Excel</span>
            <ChevronRight size={18} />
            <span>Reglas</span>
            <ChevronRight size={18} />
            <span>Dashboard</span>
            <ChevronRight size={18} />
            <span>MCP</span>
          </div>
        </section>
        <section className="login-panel">
          <p className="eyebrow">Acceso demo</p>
          <h2>Centro de control</h2>
          <label>Usuario</label>
          <input value="operador.centrosur@demo.local" readOnly />
          <label>Perfil</label>
          <input value="Analista de abastecimiento" readOnly />
          <button className="primary-action" onClick={onLogin}><LogIn size={18} /> Entrar al sistema</button>
        </section>
      </div>
    </main>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function viewTitle(view: View) {
  return {
    dashboard: "Dashboard ejecutivo",
    inventory: "Inventario",
    transfers: "Transferencias sugeridas",
    alerts: "Alertas críticas",
    assets: "Activos eléctricos"
  }[view];
}

function Metrics({ dashboard }: { dashboard: DashboardSummary | null }) {
  return (
    <section className="metric-grid" aria-label="Dashboard ejecutivo">
      <Metric icon={<Boxes />} label="Total materiales" value={dashboard?.totalMaterials ?? 0} />
      <Metric icon={<AlertTriangle />} label="Materiales criticos" value={dashboard?.criticalMaterials ?? 0} tone="danger" />
      <Metric icon={<LayoutDashboard />} label="Alertas" value={dashboard?.alerts ?? 0} tone="warning" />
      <Metric icon={<ArrowRightLeft />} label="Transferencias" value={dashboard?.transferSuggestions ?? 0} tone="success" />
    </section>
  );
}

function WarehousePanel({ dashboard }: { dashboard: DashboardSummary | null }) {
  return (
    <Panel title="Inventario por bodega">
      <div className="warehouse-list">
        {Object.entries(dashboard?.inventoryByWarehouse ?? {}).map(([warehouse, total]) => (
          <div className="warehouse-row" key={warehouse}>
            <div>
              <Building2 size={18} />
              <span>{warehouse}</span>
            </div>
            <strong>{total}</strong>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function TransfersPanel({ transfers, expanded = false }: { transfers: TransferSuggestion[]; expanded?: boolean }) {
  return (
    <Panel title="Transferencias sugeridas">
      <div className={`recommendation-list ${expanded ? "expanded-list" : ""}`}>
        {transfers.map((transfer) => (
          <article className="recommendation" key={`${transfer.code}-${transfer.destinationWarehouse}`}>
            <div className="recommendation-main">
              <strong>{transfer.material}</strong>
              <Badge value={transfer.criticality} />
            </div>
            <p>{transfer.originWarehouse}{" -> "}{transfer.destinationWarehouse} - {transfer.suggestedQuantity} unidades</p>
            <small>{transfer.explanation}</small>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function AlertsPanel({ alerts, expanded = false }: { alerts: StockAlert[]; expanded?: boolean }) {
  return (
    <Panel title="Alertas críticas">
      <div className={expanded ? "alert-cards" : "table-wrap"}>
        {expanded ? alerts.map((alert) => (
          <article className="alert-card" key={`${alert.code}-${alert.warehouse}`}>
            <div>
              <strong>{alert.material}</strong>
              <span>{alert.code} - {alert.warehouse}</span>
            </div>
            <div className="alert-stock">
              <Badge value={alert.criticality} />
              <strong>{alert.currentStock}/{alert.minimumStock}</strong>
            </div>
            <p>{alert.explanation}</p>
          </article>
        )) : <AlertsTable alerts={alerts} />}
      </div>
    </Panel>
  );
}

function SearchBox({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  return (
    <div className="search-wrap">
      <Search size={17} />
      <input className="search" placeholder="Buscar material, código o bodega" value={query} onChange={(event) => setQuery(event.target.value)} />
    </div>
  );
}

function InventoryActions({ materials, onAction }: { materials: InventoryItem[]; onAction: (result: UiActionResult) => void }) {
  const critical = materials.filter((item) => item.currentStock <= item.minimumStock);
  const warehouses = new Set(materials.map((item) => item.warehouse)).size;
  return (
    <div className="module-actions">
      <button onClick={() => onAction({
        title: "Resumen de inventario",
        message: `${materials.length} registros visibles, ${critical.length} materiales bajo mínimo y ${warehouses} bodegas involucradas.`
      })}>Generar resumen</button>
      <button onClick={() => onAction({
        title: "Validación de stock",
        message: materials.some((item) => item.currentStock < 0)
          ? "Se detectaron registros con stock negativo."
          : "Validación correcta: no hay stock negativo en los registros visibles."
      })}>Validar stock</button>
      <button onClick={() => onAction({
        title: "Priorización",
        message: critical.length
          ? `Prioridad alta para ${critical[0].material} en ${critical[0].warehouse}.`
          : "No hay materiales críticos en la vista actual."
      })}>Priorizar críticos</button>
    </div>
  );
}

function TransferActions({ transfers, onAction }: { transfers: TransferSuggestion[]; onAction: (result: UiActionResult) => void }) {
  const totalUnits = transfers.reduce((sum, transfer) => sum + transfer.suggestedQuantity, 0);
  const top = transfers[0];
  return (
    <div className="module-actions">
      <button onClick={() => onAction({
        title: "Plan de transferencias",
        message: `Se sugieren ${transfers.length} transferencias por ${totalUnits} unidades en total.`
      })}>Generar plan</button>
      <button onClick={() => onAction({
        title: "Transferencia prioritaria",
        message: top ? `${top.material}: mover ${top.suggestedQuantity} unidades desde ${top.originWarehouse} hacia ${top.destinationWarehouse}.` : "No hay transferencias sugeridas."
      })}>Revisar prioridad</button>
      <button onClick={() => onAction({
        title: "Aprobación demo",
        message: top ? `Transferencia de ${top.material} marcada como aprobada para demostración.` : "No hay transferencias para aprobar."
      })}>Aprobar sugerencia</button>
    </div>
  );
}

function AlertActions({ alerts, onAction }: { alerts: StockAlert[]; onAction: (result: UiActionResult) => void }) {
  const high = alerts.filter((alert) => alert.criticality === "ALTA");
  const top = alerts[0];
  return (
    <div className="module-actions">
      <button onClick={() => onAction({
        title: "Resumen de alertas",
        message: `${alerts.length} alertas activas. ${high.length} son de criticidad alta.`
      })}>Generar resumen</button>
      <button onClick={() => onAction({
        title: "Atención inmediata",
        message: top ? `${top.material} en ${top.warehouse}: stock ${top.currentStock}/${top.minimumStock}.` : "No hay alertas activas."
      })}>Ver prioridad</button>
      <button onClick={() => onAction({
        title: "Caso de reposición",
        message: top ? `Se generó un caso demo para reponer ${top.material} por déficit de ${top.deficit} unidades.` : "No hay déficit para reponer."
      })}>Crear caso</button>
    </div>
  );
}

function ActionNotice({ title, message }: UiActionResult) {
  return (
    <div className="action-notice">
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  );
}

function InventoryTable({ materials }: { materials: InventoryItem[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Material</th>
            <th>Categoria</th>
            <th>Bodega</th>
            <th>Stock</th>
            <th>Criticidad</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((item) => (
            <tr key={`${item.code}-${item.warehouse}`}>
              <td>{item.code}</td>
              <td>{item.material}</td>
              <td>{item.category}</td>
              <td>{item.warehouse}</td>
              <td>{item.currentStock}/{item.minimumStock}</td>
              <td><Badge value={item.criticality} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertsTable({ alerts }: { alerts: StockAlert[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Codigo</th>
          <th>Material</th>
          <th>Bodega</th>
          <th>Stock</th>
          <th>Criticidad</th>
        </tr>
      </thead>
      <tbody>
        {alerts.map((alert) => (
          <tr key={`${alert.code}-${alert.warehouse}`}>
            <td>{alert.code}</td>
            <td>{alert.material}</td>
            <td>{alert.warehouse}</td>
            <td>{alert.currentStock}/{alert.minimumStock}</td>
            <td><Badge value={alert.criticality} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AssetsPanel({ assets, onRefresh }: { assets: ElectricAsset[]; onRefresh: () => Promise<void> }) {
  const [selectedId, setSelectedId] = useState(assets[0]?.id ?? "");
  const [location, setLocation] = useState("Bodega tecnica demo");
  const [installYear, setInstallYear] = useState("2010");
  const [result, setResult] = useState<AssetActionResult | null>(null);
  const currentYear = new Date().getFullYear();
  const selectedAsset = assets.find((asset) => asset.id === selectedId) ?? assets[0];
  const businessQuery = assets.filter((asset) =>
    asset.tipo === "transformador"
    && currentYear - asset.anioInstalacion > 20
    && asset.fallasUltimosCincoAnios >= 3
    && !asset.reemplazoProgramado
  );

  useEffect(() => {
    if (!selectedId && assets[0]) setSelectedId(assets[0].id);
  }, [assets, selectedId]);

  const callAssetApi = async (title: string, path: string, options?: RequestInit) => {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
      ...options
    });
    const text = response.status === 204 ? "Operación completada" : JSON.stringify(await response.json(), null, 2);
    setResult({ title, body: text });
    if (options?.method && options.method !== "GET") {
      await onRefresh();
    }
  };

  return (
    <section className="assets-layout">
      <Panel title="Consulta MCP demostrada">
        <div className="mcp-query">
          <span>Pregunta empresarial</span>
          <strong>Transformadores con más de 20 años, tres o más fallas y sin reemplazo programado.</strong>
        </div>
        <div className="asset-card-grid">
          {businessQuery.map((asset) => (
            <AssetCard asset={asset} key={asset.id} />
          ))}
        </div>
      </Panel>

      <Panel title="Herramientas del activo">
        <div className="tool-console">
          <label>
            Activo
            <select value={selectedAsset?.id ?? ""} onChange={(event) => setSelectedId(event.target.value)}>
              {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.id} - {asset.nombre}</option>)}
            </select>
          </label>

          <div className="tool-grid">
            <button onClick={() => selectedAsset && callAssetApi("consultar_activo", `/assets/${selectedAsset.id}`)}>Consultar activo</button>
            <button onClick={() => selectedAsset && callAssetApi("consultar_historial_activo", `/assets/${selectedAsset.id}/history`)}>Historial</button>
            <button onClick={() => selectedAsset && callAssetApi("consultar_garantia", `/assets/${selectedAsset.id}/warranty`)}>Garantia</button>
            <button onClick={() => selectedAsset && callAssetApi("consultar_vida_util", `/assets/${selectedAsset.id}/useful-life`)}>Vida útil</button>
            <button onClick={() => selectedAsset && callAssetApi("evaluar_criticidad", `/assets/criticality?id=${selectedAsset.id}`)}>Criticidad</button>
          </div>

          <div className="tool-form">
            <label>
              Nueva ubicación
              <input value={location} onChange={(event) => setLocation(event.target.value)} />
            </label>
            <button onClick={() => selectedAsset && callAssetApi("cambiar_ubicacion", `/assets/${selectedAsset.id}/location`, {
              method: "POST",
              body: JSON.stringify({ nuevaUbicacion: location })
            })}>Cambiar ubicación</button>
          </div>

          <div className="tool-form">
            <label>
              Año instalación
              <input value={installYear} onChange={(event) => setInstallYear(event.target.value)} />
            </label>
            <button onClick={() => selectedAsset && callAssetApi("registrar_instalacion", `/assets/${selectedAsset.id}/installation`, {
              method: "POST",
              body: JSON.stringify({ anioInstalacion: Number(installYear), ubicacion: selectedAsset.ubicacion })
            })}>Registrar instalación</button>
            <button className="danger-action" onClick={() => selectedAsset && callAssetApi("registrar_retiro", `/assets/${selectedAsset.id}/retire`, {
              method: "POST",
              body: JSON.stringify({ motivo: "Retiro demo desde interfaz" })
            })}>Registrar retiro</button>
          </div>

          {result && (
            <pre className="tool-result"><strong>{result.title}</strong>{`\n${result.body}`}</pre>
          )}
        </div>
      </Panel>

      <Panel title="Todos los activos eléctricos">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Activo</th>
                <th>Tipo</th>
                  <th>Ubicación</th>
                <th>Edad</th>
                <th>Fallas</th>
                <th>Criticidad</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td>{asset.id}</td>
                  <td>{asset.nombre}</td>
                  <td>{asset.tipo}</td>
                  <td>{asset.ubicacion}</td>
                  <td>{currentYear - asset.anioInstalacion}</td>
                  <td>{asset.fallasUltimosCincoAnios}</td>
                  <td><AssetBadge value={asset.criticidad} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}

function AssetCard({ asset }: { asset: ElectricAsset }) {
  const age = new Date().getFullYear() - asset.anioInstalacion;
  return (
    <article className="asset-card">
      <div className="asset-card-header">
        <div>
          <span>{asset.id}</span>
          <strong>{asset.nombre}</strong>
        </div>
        <AssetBadge value={asset.criticidad} />
      </div>
      <dl className="asset-facts">
        <div><dt>Ubicación</dt><dd>{asset.ubicacion}</dd></div>
        <div><dt>Edad</dt><dd>{age} años</dd></div>
        <div><dt>Fallas</dt><dd>{asset.fallasUltimosCincoAnios}</dd></div>
        <div><dt>Reemplazo</dt><dd>{asset.reemplazoProgramado ? "Programado" : "No programado"}</dd></div>
      </dl>
      <p>{asset.estadoOperativo}. Vida útil estimada: {asset.vidaUtilAnios} años.</p>
      <ul>
        {asset.historial.slice(0, 3).map((event) => <li key={event}>{event}</li>)}
      </ul>
    </article>
  );
}

function Metric({ icon, label, value, tone = "default" }: { icon: React.ReactNode; label: string; value: number; tone?: string }) {
  return (
    <article className={`metric metric-${tone}`}>
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Badge({ value }: { value: Criticality }) {
  return <span className={`badge badge-${value.toLowerCase()}`}>{value}</span>;
}

function AssetBadge({ value }: { value: AssetCriticality }) {
  return <span className={`badge badge-${value}`}>{value.toUpperCase()}</span>;
}

createRoot(document.getElementById("root")!).render(<App />);
