import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import STYLES from "./styles";
import { uid, today } from "./constants";
import CountOrder from "./CountOrder";
import OrderView from "./OrderView";
import Manage from "./Manage";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY || "";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [page, setPage] = useState("count");
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [productSuppliers, setProductSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [staffR, prodsR, supsR, psupsR, ordersR] = await Promise.all([
        sb.from("staff").select("*").eq("active", true).order("created_at"),
        sb.from("products").select("*").order("name"),
        sb.from("suppliers").select("*").order("name"),
        sb.from("product_suppliers").select("*"),
        sb.from("orders2").select("*").order("created_at", { ascending: false }),
      ]);
      if (staffR.data) setStaff(staffR.data);
      if (supsR.data) setSuppliers(supsR.data);
      if (psupsR.data) setProductSuppliers(psupsR.data);
      if (prodsR.data) {
        const psupsData = psupsR.data || [];
        setProducts(prodsR.data.map(p => ({
          ...p,
          productSuppliers: psupsData.filter(ps => ps.product_id === p.id),
        })));
      }
      if (ordersR.data) setOrders(ordersR.data.map(o => ({ ...o, items: o.items || [] })));
      setLoading(false);
    })();
  }, []);

  const handlePin = digit => {
    const newPin = pin + digit;
    setPin(newPin);
    setPinError("");
    if (newPin.length === 4) {
      const user = staff.find(s => s.pin === newPin);
      if (user) {
        setCurrentUser(user);
        setPin("");
        setPage(user.can_count ? "count" : user.can_order ? "order" : "manage");
      } else {
        setPinError("Incorrect PIN");
        setTimeout(() => { setPin(""); setPinError(""); }, 1000);
      }
    }
  };

  const handleLogout = () => { setCurrentUser(null); setPin(""); };

  const saveStaff = async s => {
    const { data, error } = await sb.from("staff").upsert({ ...s, active: true }).select().single();
    if (error) { showToast("Error: " + error.message, true); return; }
    setStaff(p => { const ex = p.find(x => x.id === data.id); return ex ? p.map(x => x.id === data.id ? data : x) : [...p, data]; });
  };
  const delStaff = async id => {
    await sb.from("staff").update({ active: false }).eq("id", id);
    setStaff(p => p.filter(s => s.id !== id));
    showToast("Staff removed");
  };

const saveProd = async prod => {
    const isNew = !prod.id || !products.find(x => x.id === prod.id);
  const saveProd = async prod => {
    const isNew = !prod.id || !products.find(x => x.id === prod.id);
    const row = {
      id: prod.id || uid(),
      name: prod.name,
      category: prod.category,
      count_note: prod.count_note || "",
      order_unit: prod.order_unit || "case",
      count_unit: prod.count_unit || "each",
      conv_factor: parseFloat(prod.conv_factor) || 1,
      par: parseFloat(prod.par) || 0,
      price_per_order: parseFloat(prod.price_per_order) || 0,
      price_per_count: parseFloat(prod.price_per_count) || 0,
    };
    let data, error;
    if (isNew) {
      const res = await sb.from("products").insert(row).select().single();
      data = res.data; error = res.error;
    } else {
      const res = await sb.from("products").update(row).eq("id", row.id).select().single();
      data = res.data; error = res.error;
    }
    if (error) { showToast("Error: " + error.message, true); return; }
    const psupsData = productSuppliers.filter(ps => ps.product_id === data.id);
    setProducts(p => {
      const ex = p.find(x => x.id === data.id);
      return ex ? p.map(x => x.id === data.id ? { ...data, productSuppliers: psupsData } : x) : [...p, { ...data, productSuppliers: psupsData }];
    });
    showToast("Product saved");
  };
  const delProd = async id => {
    await sb.from("products").delete().eq("id", id);
    setProducts(p => p.filter(x => x.id !== id));
    showToast("Product removed");
  };

    const importProducts = async rows => {
    const cleanRows = rows.map(r => ({ ...r, price_per_order: r.price_per_order || 0, price_per_count: r.price_per_count || 0 }));
    const { error } = await sb.from("products").upsert(cleanRows);
    if (error) { showToast("Import error: " + error.message, true); return; }
    setProducts(p => {
      const newProds = rows.map(r => ({ ...r, productSuppliers: [] }));
      const existing = p.filter(x => !rows.find(r => r.id === x.id));
      return [...existing, ...newProds].sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const saveSupplier = async sup => {
    const { data, error } = await sb.from("suppliers").upsert({ id: sup.id || uid(), name: sup.name, phone: sup.phone || "", email: sup.email || "", contact: sup.contact || "" }).select().single();
    if (error) { showToast("Error: " + error.message, true); return; }
    setSuppliers(p => { const ex = p.find(x => x.id === data.id); return ex ? p.map(x => x.id === data.id ? data : x) : [...p, data]; });
    showToast("Supplier saved");
  };
  const delSupplier = async id => {
    await sb.from("suppliers").delete().eq("id", id);
    setSuppliers(p => p.filter(s => s.id !== id));
    showToast("Supplier removed");
  };

  const saveProductSupplier = async ps => {
    const { data, error } = await sb.from("product_suppliers").upsert(ps).select().single();
    if (error) { showToast("Error: " + error.message, true); return; }
    setProductSuppliers(p => [...p.filter(x => x.id !== data.id), data]);
    setProducts(p => p.map(prod => {
      if (prod.id !== ps.product_id) return prod;
      const updated = [...(prod.productSuppliers || []).filter(x => x.id !== data.id), data];
      return { ...prod, productSuppliers: updated };
    }));
  };
  const delProductSupplier = async id => {
    const ps = productSuppliers.find(x => x.id === id);
    await sb.from("product_suppliers").delete().eq("id", id);
    setProductSuppliers(p => p.filter(x => x.id !== id));
    if (ps) {
      setProducts(p => p.map(prod => {
        if (prod.id !== ps.product_id) return prod;
        return { ...prod, productSuppliers: (prod.productSuppliers || []).filter(x => x.id !== id) };
      }));
    }
  };

  const saveOrder = async ({ items, totalCost, createdBy }) => {
    const row = { id: uid(), date: today(), status: "draft", items, total_cost: totalCost, created_by: createdBy, notes: "" };
    const { data, error } = await sb.from("orders2").insert(row).select().single();
    if (error) { showToast("Error: " + error.message, true); return; }
    setOrders(p => [{ ...data, items: data.items || [] }, ...p]);
  };
  const updateOrder = async (id, updates) => {
    const { data, error } = await sb.from("orders2").update(updates).eq("id", id).select().single();
    if (error) { showToast("Error: " + error.message, true); return; }
    setOrders(p => p.map(o => o.id === id ? { ...data, items: data.items || [] } : o));
  };

  const NAV = [
    currentUser?.can_count && { id: "count", label: "Count and Order" },
    currentUser?.can_order && { id: "order", label: "Order View" },
    currentUser?.can_manage && { id: "manage", label: "Management" },
  ].filter(Boolean);

  if (loading) return (
    <>
      <style>{STYLES}</style>
      <div className="loading"><div className="spinner" /><span>Loading Lighthouse...</span></div>
    </>
  );

  if (!currentUser) return (
    <>
      <style>{STYLES}</style>
      <div className="pin-screen">
        <div className="pin-card">
          <div className="pin-logo">LIGHTHOUSE</div>
          <div className="pin-sub">Coastal Brasserie</div>
          <div className="pin-dots">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={"pin-dot" + (pin.length > i ? " filled" : "")} />
            ))}
          </div>
          <div className="pin-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
              <button key={d} className="pin-btn" onClick={() => handlePin(String(d))}>{d}</button>
            ))}
            <div />
            <button className="pin-btn" onClick={() => handlePin("0")}>0</button>
            <button className="pin-btn" style={{ fontSize: 16 }} onClick={() => setPin(p => p.slice(0, -1))}>del</button>
          </div>
          {pinError && <div className="pin-error">{pinError}</div>}
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="layout">
        <nav className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-main">LIGHTHOUSE</div>
            <div className="logo-sub">Coastal Brasserie</div>
          </div>
          {NAV.map(n => (
            <button key={n.id}
              className={"nav-btn" + (page === n.id ? " active" : "")}
              onClick={() => setPage(n.id)}>
              {n.label}
            </button>
          ))}
          <div className="nav-user">
            <div className="nav-user-name">{currentUser.name}</div>
            <div className="nav-user-role">{currentUser.role}</div>
            <button className="btn btn-ghost btn-sm mt8 w100"
              style={{ color: "rgba(255,255,255,.6)", borderColor: "rgba(255,255,255,.2)" }}
              onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </nav>
        <main className="main">
          {page === "count" && currentUser.can_count && (
            <CountOrder products={products} suppliers={suppliers} onSaveOrder={saveOrder} showToast={showToast} currentUser={currentUser} />
          )}
          {page === "order" && currentUser.can_order && (
            <OrderView orders={orders} suppliers={suppliers} updateOrder={updateOrder} showToast={showToast} isGM={currentUser.role === "gm"} />
          )}
          {page === "manage" && currentUser.can_manage && (
            <Manage
              staff={staff} products={products} suppliers={suppliers}
              saveStaff={saveStaff} delStaff={delStaff}
              saveProd={saveProd} delProd={delProd} importProducts={importProducts}
              saveSupplier={saveSupplier} delSupplier={delSupplier}
              saveProductSupplier={saveProductSupplier} delProductSupplier={delProductSupplier}
              showToast={showToast}
            />
          )}
        </main>
      </div>
      {toast && <div className={"toast" + (toast.err ? " toast-err" : " toast-ok")}>{toast.msg}</div>}
    </>
  );
}
