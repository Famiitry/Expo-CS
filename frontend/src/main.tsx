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

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
type View = "dashboard" | "inventory" | "transfers" | "alerts";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [materials, setMaterials] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [transfers, setTransfers] = useState<TransferSuggestion[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Datos demo cargados");
  const [isImporting, setIsImporting] = useState(false);

  const loadData = async () => {
    const [dashboardResponse, materialsResponse, alertsResponse, transfersResponse] = await Promise.all([
      fetch(`${API_BASE}/dashboard`),
      fetch(`${API_BASE}/materials`),
      fetch(`${API_BASE}/alerts`),
      fetch(`${API_BASE}/transfers`)
    ]);
    setDashboard(await dashboardResponse.json());
    setMaterials(await materialsResponse.json());
    setAlerts(await alertsResponse.json());
    setTransfers(await transfersResponse.json());
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
        ? "La importacion tardo demasiado. Revisa el backend o intenta con otro Excel."
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
        </nav>
        <button className="logout-button" onClick={() => setIsLoggedIn(false)}><LogOut size={18} /> Salir</button>
      </aside>

      <main className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Gestion inteligente de inventario electrico</p>
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
            <InventoryTable materials={filteredMaterials} />
          </Panel>
        )}

        {activeView === "transfers" && <TransfersPanel transfers={transfers} expanded />}

        {activeView === "alerts" && <AlertsPanel alerts={alerts} expanded />}
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
              <span>Empresa electrica demo</span>
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
    alerts: "Alertas criticas"
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
    <Panel title="Alertas criticas">
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
      <input className="search" placeholder="Buscar material, codigo o bodega" value={query} onChange={(event) => setQuery(event.target.value)} />
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

createRoot(document.getElementById("root")!).render(<App />);
