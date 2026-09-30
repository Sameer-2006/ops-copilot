import { Fragment, useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  Polyline
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API = `${import.meta.env.VITE_API_URL}/api`;

const post = (url, body) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

const ADDRESS_FIELDS = [
  ["house_number", "House"],
  ["street", "Street"],
  ["city", "City"],
  ["state", "State"],
  ["postal_code", "Pincode"],
  ["country", "Country"]
];

const joinAddress = (a, withCountry = false) =>
  [
    a.house_number,
    a.street,
    a.city,
    a.state,
    a.postal_code,
    withCountry && a.country
  ]
    .filter(Boolean)
    .join(", ");

const STYLES = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap");

* { box-sizing: border-box; }


#root {
  width: 100%;
  max-width: none;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  border: 0;
  display: block;
  text-align: left;
}
body { display: block; place-items: initial; min-width: 320px; }

html, body {
  margin: 0;
  background: #fff;
  color: #424242;
  font-family: "Inter", -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

button, input, select { font-family: inherit; }
button { cursor: pointer; }


.topbar {
  height: 68px;
  padding: 0 4%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 1000;
}
.brand { color: #387ed1; font-size: 22px; font-weight: 600; letter-spacing: 1px; }
.main-nav { display: flex; gap: 32px; }
.main-nav a { color: #666; font-size: 15px; text-decoration: none; }
.main-nav a:hover { color: #387ed1; }
.live { display: flex; align-items: center; gap: 8px; color: #4caf50; font-size: 13px; }
.live::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: #4caf50; }


.main { width: 100%; max-width: none; margin: 0; padding: 48px 4% 80px; }
.panel { margin-bottom: 40px; border: 1px solid #eee; border-radius: 4px; background: #fff; overflow: hidden; }
.panel-header { padding: 24px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.panel-title { margin: 0; color: #424242; font-size: 24px; font-weight: 400; }
.panel-subtitle { margin-top: 6px; color: #9b9b9b; font-size: 15px; }
.empty { padding: 24px; color: #9b9b9b; font-size: 15px; }


.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 40px; }
.stat-card { padding: 24px; border: 1px solid #eee; border-radius: 4px; }
.stat-label { color: #9b9b9b; font-size: 14px; }
.stat-number { margin-top: 10px; font-size: 34px; font-weight: 300; }
.blue { color: #387ed1; } .green { color: #4caf50; } .amber { color: #ff9800; } .red { color: #df514c; }


.intake-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; }
.box { padding: 20px; border: 1px solid #eee; border-radius: 4px; }
.fields { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
.field-label { display: block; margin-bottom: 6px; color: #9b9b9b; font-size: 13px; }
.input, select {
  width: 100%;
  min-height: 40px;
  padding: 8px 12px;
  margin-bottom: 14px;
  border: 1px solid #ddd;
  border-radius: 3px;
  background: #fff;
  color: #424242;
  font-size: 14px;
}
.input:focus, select:focus { outline: none; border-color: #387ed1; }
.actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; grid-column: 1 / -1; }
.ocr-text { margin-top: 14px; padding: 12px; background: #fafafa; border-radius: 3px; color: #666; font-size: 13px; line-height: 1.6; word-break: break-word; }
.notice { margin-top: 14px; padding: 10px 12px; border-radius: 3px; font-size: 13px; }
.notice.good { color: #2e7d32; background: #f1f8f2; }
.notice.warn { color: #b26a00; background: #fff8e8; }


.btn { min-height: 40px; padding: 8px 22px; border: 1px solid #387ed1; border-radius: 3px; background: #387ed1; color: #fff; font-size: 14px; }
.btn:hover:not(:disabled) { background: #2f6fbd; }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn.green-btn { background: #4caf50; border-color: #4caf50; }
.btn.outline { background: #fff; color: #df514c; border-color: #df514c; }
.btn.outline:hover:not(:disabled) { background: #fff5f5; }
.btn.ghost { background: #fff; color: #387ed1; }
.btn.ghost:hover:not(:disabled) { background: #f5f9ff; }


.map-container { width: 100%; height: 470px; }


.order-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; padding: 24px; }
.order-card, .proposal-card { padding: 16px; border: 1px solid #eee; border-radius: 4px; }
.proposal-card { margin: 16px 24px; }
.order-id { color: #387ed1; font-size: 12px; word-break: break-all; }
.order-route { margin: 10px 0; font-size: 14px; line-height: 1.6; }
.badges { display: flex; gap: 6px; flex-wrap: wrap; }
.badge { padding: 3px 8px; border-radius: 3px; background: #f5f5f5; color: #666; font-size: 12px; }
.proposal-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.proposal-row .arrow { color: #387ed1; font-size: 18px; }
.approval-bar { padding: 16px 24px; display: flex; gap: 10px; border-top: 1px solid #eee; }
.broken-rider { padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; border-bottom: 1px solid #eee; }
.broken-rider:last-child { border-bottom: 0; }
.broken-rider h3 { margin: 0 0 4px; font-size: 16px; font-weight: 500; }
.broken-rider p { margin: 0; color: #9b9b9b; font-size: 14px; }
.alert { border-color: #f3d0ce; }
.result { padding: 16px 24px; margin-bottom: 40px; border: 1px solid #eee; border-radius: 4px; font-size: 14px; }


.audit-list { max-height: 390px; overflow-y: auto; }
.audit-row { display: grid; grid-template-columns: 170px 1fr; gap: 18px; padding: 14px 24px; border-bottom: 1px solid #f3f3f3; }
.audit-time { color: #9b9b9b; font-size: 12px; }
.audit-action { color: #387ed1; font-size: 13px; font-weight: 500; }
.audit-entity { margin-top: 3px; font-size: 13px; }
.audit-details { margin-top: 4px; color: #9b9b9b; font-size: 12px; word-break: break-word; }


.rider-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 24px; }
.rider-card { padding: 16px; border: 1px solid #eee; border-radius: 4px; }
.rider-card.broken { border-color: #f3d0ce; background: #fffafa; }
.rider-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.rider-name { font-size: 15px; font-weight: 500; }
.status { padding: 3px 8px; border-radius: 3px; font-size: 12px; }
.status.active { color: #2e7d32; background: #f1f8f2; }
.status.broken { color: #df514c; background: #fdeeed; }
.load-bar { height: 4px; margin-top: 14px; border-radius: 4px; background: #eee; overflow: hidden; }
.load-fill { height: 100%; background: #387ed1; }
.muted { margin-top: 8px; color: #9b9b9b; font-size: 12px; }

@media (max-width: 1000px) {
  .stats, .rider-grid { grid-template-columns: repeat(2, 1fr); }
  .main-nav { display: none; }
}
@media (max-width: 700px) {
  .intake-grid, .order-list, .fields, .audit-row { grid-template-columns: 1fr; }
  .stats, .rider-grid { grid-template-columns: 1fr; }
  .proposal-row, .broken-rider { flex-direction: column; align-items: flex-start; }
  .map-container { height: 360px; }
}
`;

function Panel({ id, title, subtitle, right, className = "", children }) {
  return (
    <section id={id} className={`panel ${className}`}>
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          {subtitle && <div className="panel-subtitle">{subtitle}</div>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function App() {
  const [riders, setRiders] = useState([]);
  const [orders, setOrders] = useState([]);

  const [selectedBrokenRider, setSelectedBrokenRider] = useState(null);
  const [affectedOrders, setAffectedOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [aiProposal, setAiProposal] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState("");

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");

  const [addressFile, setAddressFile] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [ocrResult, setOcrResult] = useState("");
  const [structuredAddress, setStructuredAddress] = useState(null);
  const [placementStatus, setPlacementStatus] = useState("");
  const [addressConfirmed, setAddressConfirmed] = useState(false);

  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupSource, setPickupSource] = useState("WAREHOUSE");
  const [orderWeight, setOrderWeight] = useState(1);
  const [orderPriority, setOrderPriority] = useState("MEDIUM");
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");


  const fetchRiders = async () => {
    try {
      setRiders(await (await fetch(`${API}/riders`)).json());
    } catch (error) {
      console.error("Rider error:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrders(await (await fetch(`${API}/orders`)).json());
    } catch (error) {
      console.error("Order error:", error);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    setAuditError("");
    try {
      const response = await fetch(`${API}/audit`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch audit logs");
      }
      setAuditLogs(Array.isArray(data) ? data : data.logs || []);
    } catch (error) {
      console.error("Audit log error:", error);
      setAuditError(error.message);
    } finally {
      setAuditLoading(false);
    }
  };

  const logAudit = async (action, entityType, entityId = null, details = {}) => {
    try {
      await post(`${API}/audit`, { action, entityType, entityId, details });
    } catch (error) {
      console.error("Could not write audit log:", error);
    } finally {
      fetchAuditLogs();
    }
  };

  useEffect(() => {
    fetchRiders();
    fetchOrders();
    fetchAuditLogs();
  }, []);

  useEffect(() => {
  const socket = io(import.meta.env.VITE_API_URL);
    socket.on("riderUpdated", (updated) =>
      setRiders((current) =>
        current.map((r) => (r._id === updated._id ? updated : r))
      )
    );
    return () => socket.disconnect();
  }, []);

  const processAddressImage = async () => {
    if (!addressFile) {
      setAddressError("Please select an address image first.");
      return;
    }

    setAddressLoading(true);
    setAddressError("");
    setOrderMessage("");
    setOcrResult("");
    setStructuredAddress(null);
    setPlacementStatus("");
    setAddressConfirmed(false);

    try {
      const formData = new FormData();
      formData.append("file", addressFile);

      const response = await fetch(`${API}/addresses/process`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Address processing failed");
      }

      setOcrResult(data.ocrText || "");
      setStructuredAddress(data.structuredAddress || null);
      setPlacementStatus(data.placementStatus || "UNPLACED");

      if (!data.structuredAddress) {
        setAddressError(
          "The address could not be placed. Please try another image or enter the address manually."
        );
      }
    } catch (error) {
      console.error("Address processing error:", error);
      setAddressError(error.message);
    } finally {
      setAddressLoading(false);
    }
  };

  const updateAddressField = (field, value) => {
    setStructuredAddress((current) => ({ ...(current || {}), [field]: value }));
    setAddressConfirmed(false);
    setPlacementStatus("READY_FOR_REVIEW");
  };

  const confirmAddress = () => {
    if (!structuredAddress) return;

    const hasStreet = structuredAddress.house_number || structuredAddress.street;
    const hasLocation =
      structuredAddress.city ||
      structuredAddress.state ||
      structuredAddress.postal_code;

    if (!hasStreet || !hasLocation) {
      setAddressError(
        "Please provide at least a street/house number and a city/state/pincode."
      );
      return;
    }

    setAddressError("");
    setAddressConfirmed(true);
    setPlacementStatus("CONFIRMED");
  };

  const geocode = async (address) => {
    const response = await post(`${API}/addresses/geocode`, { address });
    const data = await response.json();
    if (!response.ok || !data.location) {
      throw new Error(data.message || `Could not locate: ${address}`);
    }
    return data.location;
  };

  const createOrderFromAddress = async () => {
    if (!addressConfirmed || !structuredAddress) {
      setOrderMessage("Please confirm the delivery address first.");
      return;
    }
    if (!pickupAddress.trim()) {
      setOrderMessage("Please enter the pickup address.");
      return;
    }

    setCreatingOrder(true);
    setOrderMessage("");

    try {
      const deliveryAddress = joinAddress(structuredAddress, true);
      const pickupLocation = await geocode(pickupAddress);
      const deliveryLocation = await geocode(deliveryAddress);

      const response = await post(`${API}/orders`, {
        pickup: { address: pickupAddress, ...pickupLocation },
        delivery: { address: deliveryAddress, ...deliveryLocation },
        weight: Number(orderWeight),
        priority: orderPriority,
        pickupSource
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Order creation failed");
      }

      setOrderMessage(data.message || "Order created successfully");
      setPickupAddress("");
      setOrderWeight(1);
      setOrderPriority("MEDIUM");
      setAddressConfirmed(false);
      setPlacementStatus("ORDER_CREATED");

      await fetchRiders();
      await fetchOrders();
      await logAudit("ORDER_CREATED", "ORDER", data.order?._id || null, {
        pickup: pickupAddress,
        delivery: deliveryAddress,
        weight: Number(orderWeight),
        priority: orderPriority,
        pickupSource
      });
    } catch (error) {
      console.error("Order creation error:", error);
      setOrderMessage(`Order failed: ${error.message}`);
    } finally {
      setCreatingOrder(false);
    }
  };

 
  const handleReassignment = async (riderId) => {
    setLoadingOrders(true);
    setSelectedBrokenRider(riderId);
    setAffectedOrders([]);
    setAiProposal([]);
    setApprovalMessage("");

    try {
      const response = await fetch(`${API}/riders/${riderId}/affected-orders`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch affected orders");
      }
      setAffectedOrders(data.affectedOrders || []);
    } catch (error) {
      console.error("Affected orders error:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const generateAIProposal = async () => {
    if (!selectedBrokenRider) return;

    setLoadingAI(true);
    setAiProposal([]);
    setApprovalMessage("");

    try {
      const response = await post(
        `${API}/riders/${selectedBrokenRider}/ai-reassignment`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to generate AI proposal");
      }
      setAiProposal(data.proposal?.proposal || []);
    } catch (error) {
      console.error("AI proposal error:", error);
      setApprovalMessage("Failed to generate AI proposal.");
    } finally {
      setLoadingAI(false);
    }
  };

  const editProposal = (orderId, newRiderId) => {
    setAiProposal((current) =>
      current.map((p) =>
        p.orderId === orderId ? { ...p, riderId: newRiderId } : p
      )
    );
    logAudit("DISPATCHER_EDITED", "ORDER", orderId, { newRiderId });
  };

  const approveProposal = async () => {
    if (!selectedBrokenRider || aiProposal.length === 0) return;

    setApprovalLoading(true);
    setApprovalMessage("");

    try {
      const response = await post(
        `${API}/riders/${selectedBrokenRider}/approve-reassignment`,
        { proposal: aiProposal }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || "Approval failed");
      }

      setApprovalMessage("Reassignment approved");
      setAiProposal([]);
      setAffectedOrders([]);
      setSelectedBrokenRider(null);

      await fetchRiders();
      await fetchOrders();
      await fetchAuditLogs();
    } catch (error) {
      console.error("Approval error:", error);
      setApprovalMessage(`Approval failed: ${error.message}`);
    } finally {
      setApprovalLoading(false);
    }
  };

  const rejectProposal = () => {
    setAiProposal([]);
    setApprovalMessage("AI proposal rejected");
    logAudit("DISPATCHER_REJECTED", "RIDER", selectedBrokenRider, {
      proposal: aiProposal
    });
  };

 
  const brokenRiders = riders.filter((r) => r.status === "BROKEN");
  const activeRiders = riders.filter((r) => r.status === "ACTIVE");
  const assignedOrders = orders.filter((o) => o.status === "ASSIGNED");

  const stats = [
    ["Total riders", riders.length, "blue"],
    ["Active riders", activeRiders.length, "green"],
    ["Active orders", assignedOrders.length, "amber"],
    ["Disruptions", brokenRiders.length, "red"]
  ];

  const statusTone = ["READY_FOR_REVIEW", "CONFIRMED", "ORDER_CREATED"].includes(
    placementStatus
  )
    ? "good"
    : "warn";


  return (
    <div className="app">
      <style>{STYLES}</style>

      <header className="topbar">
       <div
    className="brand"
    style={{
        display: "flex",
        alignItems: "center",
        gap: "10px"
    }}
>
    <img
        src="/logo.png"
        alt=""
        style={{
            width: "32px",
            height: "32px",
            objectFit: "contain",
            display: "block"
        }}
    />
    <span>OPS COPILOT</span>
</div>

        <nav className="main-nav" aria-label="Primary navigation">
          <a href="#address">Address</a>
          <a href="#operations">Operations</a>
          <a href="#map">Live map</a>
          <a href="#audit">Audit log</a>
          <a href="#fleet">Riders</a>
        </nav>

       
      </header>

      <main className="main">
        {}
        <Panel
          id="address"
          title="OCR Reading"
          subtitle="Read an address from an image, confirm it, and create an order."
        >
          <div className="intake-grid">
            <div className="box">
              <label className="field-label">Address image</label>
              <input
                className="input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  setAddressFile(e.target.files?.[0] || null);
                  setAddressError("");
                  setOrderMessage("");
                }}
              />

              <button
                className="btn"
                onClick={processAddressImage}
                disabled={addressLoading || !addressFile}
              >
                {addressLoading ? "Reading..." : "Read address"}
              </button>

              {ocrResult && <div className="ocr-text">{ocrResult}</div>}

              {placementStatus && (
                <div className={`notice ${statusTone}`}>
                  Status: {placementStatus}
                </div>
              )}

              {addressError && <div className="notice warn">{addressError}</div>}
            </div>

            <div className="box">
              {structuredAddress ? (
                <div className="fields">
                  {ADDRESS_FIELDS.map(([key, label]) => (
                    <div key={key}>
                      <label className="field-label">{label}</label>
                      <input
                        className="input"
                        value={structuredAddress[key] || ""}
                        onChange={(e) => updateAddressField(key, e.target.value)}
                      />
                    </div>
                  ))}

                  <div className="actions">
                    <button
                      className="btn green-btn"
                      onClick={confirmAddress}
                      disabled={addressConfirmed}
                    >
                      {addressConfirmed ? "Address confirmed" : "Confirm address"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty" style={{ padding: 0 }}>
                  Upload an address image to extract the delivery address.
                </div>
              )}
            </div>
          </div>

          {addressConfirmed && (
            <div className="box" style={{ margin: "0 24px 24px" }}>
              <h3 className="panel-title" style={{ fontSize: 18, marginBottom: 16 }}>
                Create delivery order
              </h3>

              <div className="fields">
                <div>
                  <label className="field-label">Pickup address</label>
                  <input
                    className="input"
                    placeholder="Warehouse / pickup location"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label">Pickup source</label>
                  <select
                    value={pickupSource}
                    onChange={(e) => setPickupSource(e.target.value)}
                  >
                    {["WAREHOUSE", "STORE", "MARKETPLACE", "OTHER"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label">Weight (kg)</label>
                  <input
                    className="input"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={orderWeight}
                    onChange={(e) => setOrderWeight(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label">Priority</label>
                  <select
                    value={orderPriority}
                    onChange={(e) => setOrderPriority(e.target.value)}
                  >
                    {["LOW", "MEDIUM", "HIGH"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="muted" style={{ margin: "0 0 14px" }}>
                Delivering to: {joinAddress(structuredAddress)}
              </div>

              <button
                className="btn green-btn"
                onClick={createOrderFromAddress}
                disabled={creatingOrder}
              >
                {creatingOrder ? "Creating order..." : "Create order"}
              </button>

              {orderMessage && (
                <div
                  className={`notice ${
                    orderMessage.toLowerCase().includes("failed") ? "warn" : "good"
                  }`}
                >
                  {orderMessage}
                </div>
              )}
            </div>
          )}
        </Panel>

        
        <section id="operations" className="stats">
          {stats.map(([label, value, tone]) => (
            <div className="stat-card" key={label}>
              <div className="stat-label">{label}</div>
              <div className={`stat-number ${tone}`}>{value}</div>
            </div>
          ))}
        </section>

        {}
        {brokenRiders.length > 0 && (
          <Panel
            className="alert"
            title="Rider disruption"
            subtitle="Dispatcher action required"
          >
            {brokenRiders.map((rider) => (
              <div className="broken-rider" key={rider._id}>
                <div>
                  <h3>{rider.name}</h3>
                  <p>
                    Broken · Load {rider.currentLoad}/{rider.capacity}
                  </p>
                </div>
                <button
                  className="btn outline"
                  onClick={() => handleReassignment(rider._id)}
                >
                  Handle reassignment
                </button>
              </div>
            ))}
          </Panel>
        )}

        {}
        {selectedBrokenRider && (
          <Panel
            id="fleet"
            title="Affected orders"
            subtitle="Orders that need a new rider"
          >
            {loadingOrders ? (
              <div className="empty">Loading affected orders...</div>
            ) : affectedOrders.length === 0 ? (
              <div className="empty">No affected orders found.</div>
            ) : (
              <>
                <div className="order-list">
                  {affectedOrders.map((order) => (
                    <div className="order-card" key={order._id}>
                      <div className="order-id">{order._id}</div>
                      <div className="order-route">
                        {order.pickup?.address}
                        <br />↓<br />
                        {order.delivery?.address}
                      </div>
                      <div className="badges">
                        <span className="badge">{order.weight} kg</span>
                        <span className="badge">{order.priority}</span>
                        <span className="badge">{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "0 24px 24px" }}>
                  <button className="btn" onClick={generateAIProposal} disabled={loadingAI}>
                    {loadingAI ? "Analyzing..." : "Generate AI reassignment"}
                  </button>
                </div>
              </>
            )}
          </Panel>
        )}

        {}
        {aiProposal.length > 0 && (
          <Panel
            title="AI reassignment proposal"
            subtitle="Review and approve before it runs."
          >
            {aiProposal.map((proposal) => {
              const order = affectedOrders.find((o) => o._id === proposal.orderId);

              return (
                <div className="proposal-card" key={proposal.orderId}>
                  <div className="proposal-row">
                    <div>
                      <div className="order-id">{proposal.orderId}</div>
                      <div style={{ marginTop: 8, fontSize: 14 }}>
                        {order
                          ? `${order.weight} kg · ${order.priority}`
                          : "Order details unavailable"}
                      </div>
                    </div>

                    <div className="arrow">→</div>

                    <div>
                      <label className="field-label">Assign to</label>
                      <select
                        style={{ marginBottom: 0 }}
                        value={proposal.riderId}
                        onChange={(e) => editProposal(proposal.orderId, e.target.value)}
                      >
                        {activeRiders
                          .filter((r) => r._id !== selectedBrokenRider)
                          .map((r) => (
                            <option key={r._id} value={r._id}>
                              {r.name} | {r.currentLoad}/{r.capacity}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="approval-bar">
              <button
                className="btn green-btn"
                onClick={approveProposal}
                disabled={approvalLoading}
              >
                {approvalLoading ? "Approving..." : "Approve and execute"}
              </button>
              <button
                className="btn outline"
                onClick={rejectProposal}
                disabled={approvalLoading}
              >
                Reject
              </button>
            </div>
          </Panel>
        )}

        {approvalMessage && (
          <div
            className="result"
            style={{
              color: approvalMessage.toLowerCase().includes("failed")
                ? "#df514c"
                : "#4caf50"
            }}
          >
            {approvalMessage}
          </div>
        )}

        {}
        <Panel
          id="map"
          title="Live fleet map"
          subtitle="Riders and deliveries in real time"
          right={<div className="live">Live</div>}
        >
          <MapContainer center={[28.4595, 77.0266]} zoom={12} className="map-container">
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {riders.filter((r) => r.location).map((rider) => (
              <Marker key={rider._id} position={[rider.location.lat, rider.location.lng]}>
                <Popup>
                  <strong>{rider.name}</strong>
                  <br />
                  Status: {rider.status}
                  <br />
                  Load: {rider.currentLoad}/{rider.capacity}
                </Popup>
              </Marker>
            ))}

            {orders
              .filter((o) => o.pickup && o.delivery)
              .map((order) => (
              <Fragment key={order._id}>
                <CircleMarker center={[order.pickup.lat, order.pickup.lng]} radius={8}>
                  <Popup>
                    <strong>Pickup</strong>
                    <br />
                    {order.pickup.address}
                    <br />
                    Status: {order.status}
                  </Popup>
                </CircleMarker>

                <CircleMarker center={[order.delivery.lat, order.delivery.lng]} radius={8}>
                  <Popup>
                    <strong>Delivery</strong>
                    <br />
                    {order.delivery.address}
                    <br />
                    Status: {order.status}
                  </Popup>
                </CircleMarker>

                <Polyline
                  positions={[
                    [order.pickup.lat, order.pickup.lng],
                    [order.delivery.lat, order.delivery.lng]
                  ]}
                />
              </Fragment>
            ))}
          </MapContainer>
        </Panel>

        
        <Panel
          id="audit"
          title="Audit log"
          subtitle="Dispatcher actions and AI proposals"
          right={
            <button className="btn ghost" onClick={fetchAuditLogs} disabled={auditLoading}>
              {auditLoading ? "Refreshing..." : "Refresh"}
            </button>
          }
        >
          {auditError ? (
            <div className="empty">Could not load audit log: {auditError}</div>
          ) : auditLoading && auditLogs.length === 0 ? (
            <div className="empty">Loading audit events...</div>
          ) : auditLogs.length === 0 ? (
            <div className="empty">
              No audit events yet. Create an order or run a disruption workflow.
            </div>
          ) : (
            <div className="audit-list">
              {auditLogs.map((log) => (
                <div className="audit-row" key={log._id}>
                  <div className="audit-time">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
                  </div>
                  <div>
                    <div className="audit-action">{log.action || "EVENT"}</div>
                    <div className="audit-entity">
                      {log.entityType || "SYSTEM"}
                      {log.entityId ? ` • ${log.entityId}` : ""}
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="audit-details">{JSON.stringify(log.details)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

      
        <Panel title="Rider Status" id='fleet'>
          <div className="rider-grid">
            {riders.map((rider) => {
              const loadPercent =
                rider.capacity > 0
                  ? Math.min(100, (rider.currentLoad / rider.capacity) * 100)
                  : 0;
              const broken = rider.status === "BROKEN";

              return (
                <div className={`rider-card ${broken ? "broken" : ""}`} key={rider._id}>
                  <div className="rider-top">
                    <div className="rider-name">{rider.name}</div>
                    <span className={`status ${broken ? "broken" : "active"}`}>
                      {rider.status}
                    </span>
                  </div>

                  <div className="load-bar">
                    <div className="load-fill" style={{ width: `${loadPercent}%` }} />
                  </div>

                  <div className="muted">
                    Load {rider.currentLoad}/{rider.capacity}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </main>
    </div>
  );
}

export default App;
