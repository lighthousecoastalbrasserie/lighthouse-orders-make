import { useState, useMemo } from "react";
import { CATS, LOCATIONS, f$, cClr, sClr } from "./constants";

export default function CountOrder({ products, suppliers, onSaveOrder, showToast, currentUser }) {
  const [fCat, setFCat] = useState("all");
  const [fSup, setFSup] = useState("all");
  const [fLoc, setFLoc] = useState("all");
  const [search, setSearch] = useState("");
  const [stock, setStock] = useState({});
  const [orderQty, setOrderQty] = useState({});
  const [orderSup, setOrderSup] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const supMap = Object.fromEntries(suppliers.map(s => [s.id, s]));

  const getDefaultSup = prod => {
    if (prod.default_supplier_id) return prod.default_supplier_id;
    const sups = prod.productSuppliers || [];
    const def = sups.find(ps => ps.is_default);
    return def ? def.supplier_id : (sups[0]?.supplier_id || "");
  };

  const getChosenSup = prod => orderSup[prod.id] || getDefaultSup(prod);

  const getPrice = prod => {
    return prod.price_per_order || 0;
  };

  const filtered = useMemo(() => products.filter(p => {
    if (fCat !== "all" && p.category !== fCat) return false;
    if (fSup !== "all") {
      const hasSup = (p.productSuppliers || []).some(ps => ps.supplier_id === fSup);
      if (!hasSup) return false;
    }
    if (fLoc !== "all" && p.location !== fLoc) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [products, fCat, fSup, fLoc, search]);

  const orderItems = useMemo(() =>
    Object.entries(orderQty)
      .filter(([, qty]) => parseFloat(qty) > 0)
      .map(([pid]) => {
        const prod = products.find(p => p.id === pid);
        if (!prod) return null;
        const sid = getChosenSup(prod);
        const qty = parseFloat(orderQty[pid]) || 0;
        const price = getPrice(prod);
        return { pid, prod, sid, qty, price, subtotal: qty * price };
      }).filter(Boolean),
    [orderQty, orderSup, products]
  );

  const totalCost = orderItems.reduce((a, b) => a + b.subtotal, 0);
  const itemCount = orderItems.length;

  const handleSave = async () => {
    if (!itemCount) { showToast("No items to order", true); return; }
    setSaving(true);
    const items = orderItems.map(o => ({
      productId: o.pid,
      productName: o.prod.name,
      category: o.prod.category,
      location: o.prod.location || "",
      supplierId: o.sid,
      supplierName: supMap[o.sid]?.name || "",
      qty: o.qty,
      orderUnit: o.prod.order_unit || "EA",
      countUnit: o.prod.count_unit || "CS",
      price: o.price,
      subtotal: o.subtotal,
      stock: parseFloat(stock[o.pid]) || 0,
      countNote: o.prod.count_note || "",
    }));
    await onSaveOrder({ items, totalCost, createdBy: currentUser?.name || "Staff" });
    setOrderQty({});
    setStock({});
    setOrderSup({});
    setConfirming(false);
    setSaving(false);
    showToast("Order saved!");
  };

  const uniqueLocs = [...new Set(products.map(p => p.location).filter(Boolean))].sort();

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="flex items-center justify-between mb4">
        <div className="page-title">Count and Order</div>
        {itemCount > 0 && (
          <div className="flex items-center gap8">
            <div style={{ fontWeight: 800, fontSize: 16, color: "var(--green)" }}>{f$(totalCost)}</div>
            <button className="btn btn-yellow btn-sm" onClick={() => setConfirming(true)}>
              Save ({itemCount})
            </button>
          </div>
        )}
      </div>
      <div className="page-sub">Enter stock on hand and qty to order</div>

      <div className="filter-row">
        <input className="inp inp-sm" placeholder="Search..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 180 }} />
        <select className="inp inp-sm" value={fCat} onChange={e => setFCat(e.target.value)}>
          <option value="all">All Categories</option>
          {CATS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="inp inp-sm" value={fLoc} onChange={e => setFLoc(e.target.value)}>
          <option value="all">All Locations</option>
          {uniqueLocs.map(l => <option key={l}>{l}</option>)}
        </select>
        <select className="inp inp-sm" value={fSup} onChange={e => setFSup(e.target.value)}>
          <option value="all">All Suppliers</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {(fCat !== "all" || fLoc !== "all" || fSup !== "all" || search) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFCat("all"); setFLoc("all"); setFSup("all"); setSearch(""); }}>
            Clear
          </button>
        )}
        {Object.values(orderQty).some(v => parseFloat(v) > 0) && (
          <button className="btn btn-red btn-sm" onClick={() => { setOrderQty({}); setStock({}); }}>
            Clear Order
          </button>
        )}
      </div>

      {/* DESKTOP TABLE */}
      <div className="desktop-table">
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Count Note</th>
                  <th>Supplier</th>
                  <th>Price/CS</th>
                  <th style={{ color: "var(--blue)" }}>Stock</th>
                  <th style={{ color: "var(--green)" }}>Order Qty</th>
                  <th>Unit</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const chosenSid = getChosenSup(p);
                  const price = getPrice(p);
                  const qty = parseFloat(orderQty[p.id]) || 0;
                  const subtotal = qty * price;
                  const hasOrder = qty > 0;
                  const pSups = p.productSuppliers || [];
                  return (
                    <tr key={p.id} style={{ background: hasOrder ? "rgba(0,137,123,.04)" : "" }}>
                      <td className="font-bold">{p.name}</td>
                      <td>
                        <span className="flex items-center gap4">
                          <span className="cat-dot" style={{ background: cClr(p.category) }} />
                          <span className="text-xs">{p.category}</span>
                        </span>
                      </td>
                      <td>
                        {p.location
                          ? <span className="badge badge-blue" style={{ fontSize: 10 }}>{p.location}</span>
                          : <span className="text-muted text-xs">-</span>}
                      </td>
                      <td>
                        {p.count_note
                          ? <span className="text-xs font-mono" style={{ color: "var(--blue)", background: "var(--blue-dim)", padding: "2px 6px", borderRadius: 4 }}>{p.count_note}</span>
                          : <span className="text-muted text-xs">-</span>}
                      </td>
                      <td>
                        {pSups.length > 1 ? (
                          <select className="inp inp-sm" style={{ maxWidth: 130 }}
                            value={chosenSid}
                            onChange={e => setOrderSup(s => ({ ...s, [p.id]: e.target.value }))}>
                            {pSups.map(ps => (
                              <option key={ps.supplier_id} value={ps.supplier_id}>
                                {supMap[ps.supplier_id]?.name || ps.supplier_id}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm font-bold" style={{ color: sClr(suppliers, chosenSid) }}>
                            {supMap[chosenSid]?.name || "-"}
                          </span>
                        )}
                      </td>
                      <td className="font-mono font-bold" style={{ color: "var(--navy)" }}>
                        {price > 0 ? f$(price) : <span className="text-muted">-</span>}
                      </td>
                      <td>
                        <input type="number" min={0} step={0.5} placeholder="-"
                          className="stock-inp"
                          value={stock[p.id] ?? ""}
                          onChange={e => setStock(s => ({ ...s, [p.id]: e.target.value }))} />
                      </td>
                      <td>
                        <input type="number" min={0} step={1} placeholder="0"
                          className={"order-qty-inp" + (hasOrder ? " has-value" : "")}
                          value={orderQty[p.id] ?? ""}
                          onChange={e => setOrderQty(q => ({ ...q, [p.id]: e.target.value }))} />
                      </td>
                      <td className="font-mono text-xs text-muted">{p.order_unit || "EA"}</td>
                      <td className="font-mono font-bold" style={{ color: hasOrder ? "var(--green)" : "var(--muted)" }}>
                        {hasOrder ? f$(subtotal) : "-"}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>No products found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className="mobile-cards">
        {filtered.map(p => {
          const chosenSid = getChosenSup(p);
          const price = getPrice(p);
          const qty = parseFloat(orderQty[p.id]) || 0;
          const subtotal = qty * price;
          const hasOrder = qty > 0;
          const pSups = p.productSuppliers || [];
          return (
            <div key={p.id} className="card" style={{
              borderLeft: "3px solid " + (hasOrder ? "var(--green)" : "var(--border)"),
              background: hasOrder ? "rgba(0,137,123,.04)" : "var(--surface)",
              padding: "12px 14px",
            }}>
              <div className="flex items-center justify-between mb8">
                <div>
                  <div className="font-bold" style={{ fontSize: 15 }}>{p.name}</div>
                  <div className="flex items-center gap4 mt4" style={{ flexWrap: "wrap" }}>
                    <span className="cat-dot" style={{ background: cClr(p.category) }} />
                    <span className="text-xs text-muted">{p.category}</span>
                    {p.location && (
                      <span className="badge badge-blue" style={{ fontSize: 9, padding: "1px 5px" }}>{p.location}</span>
                    )}
                    {p.count_note && (
                      <span className="text-xs font-mono" style={{ color: "var(--blue)", background: "var(--blue-dim)", padding: "1px 6px", borderRadius: 4 }}>
                        {p.count_note}
                      </span>
                    )}
                  </div>
                </div>
                {hasOrder && (
                  <div className="text-right">
                    <div className="font-bold" style={{ color: "var(--green)", fontSize: 14 }}>{f$(subtotal)}</div>
                    <div className="text-xs text-muted">{f$(price)}/{p.order_unit || "EA"}</div>
                  </div>
                )}
              </div>
              {pSups.length > 1 ? (
                <div className="mb8">
                  <select className="inp inp-sm" value={chosenSid}
                    onChange={e => setOrderSup(s => ({ ...s, [p.id]: e.target.value }))}>
                    {pSups.map(ps => (
                      <option key={ps.supplier_id} value={ps.supplier_id}>
                        {supMap[ps.supplier_id]?.name || ps.supplier_id}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-xs mb8 font-bold" style={{ color: sClr(suppliers, chosenSid) }}>
                  {supMap[chosenSid]?.name || "No supplier"}
                </div>
              )}
              <div className="flex gap8 items-center">
                <div style={{ flex: 1 }}>
                  <label className="lbl">Stock</label>
                  <input type="number" min={0} step={0.5} placeholder="0"
                    className="stock-inp w100"
                    value={stock[p.id] ?? ""}
                    onChange={e => setStock(s => ({ ...s, [p.id]: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="lbl" style={{ color: hasOrder ? "var(--green)" : "var(--muted)" }}>Order Qty</label>
                  <input type="number" min={0} step={1} placeholder="0"
                    className={"order-qty-inp w100" + (hasOrder ? " has-value" : "")}
                    value={orderQty[p.id] ?? ""}
                    onChange={e => setOrderQty(q => ({ ...q, [p.id]: e.target.value }))} />
                </div>
                <div style={{ paddingTop: 18, fontSize: 11, color: "var(--muted)" }}>
                  {p.order_unit || "EA"}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
            No products found
          </div>
        )}
      </div>

      {confirming && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-title">Save Order?</div>
            <div className="text-muted text-sm mb16">
              {itemCount} items - Total: <strong style={{ color: "var(--green)" }}>{f$(totalCost)}</strong>
            </div>
            <div className="card mb16" style={{ background: "var(--surface2)", maxHeight: 280, overflowY: "auto" }}>
              {orderItems.map((o, i) => (
                <div key={i} className="flex justify-between items-center"
                  style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div className="font-bold text-sm">{o.prod.name}</div>
                    <div className="text-xs text-muted">{supMap[o.sid]?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{o.qty} {o.prod.order_unit || "EA"}</div>
                    <div className="text-xs text-muted">{f$(o.subtotal)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap8">
              <button className="btn btn-ghost" onClick={() => setConfirming(false)}>Cancel</button>
              <button className="btn btn-yellow" disabled={saving} onClick={handleSave}>
                {saving ? "Saving..." : "Confirm and Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
