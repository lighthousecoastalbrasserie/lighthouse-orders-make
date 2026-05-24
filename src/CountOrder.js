import { useState, useMemo } from "react";
import { CATS, f$, cClr, sClr } from "./constants";

export default function CountOrder({ products, suppliers, onSaveOrder, showToast, currentUser }) {
  const [fCat, setFCat] = useState("all");
  const [fSup, setFSup] = useState("all");
  const [search, setSearch] = useState("");
  const [stock, setStock] = useState({});
  const [orderQty, setOrderQty] = useState({});
  const [orderSup, setOrderSup] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const supMap = Object.fromEntries(suppliers.map(s => [s.id, s]));

  const getDefaultSup = prod => {
    const sups = prod.productSuppliers || [];
    const def = sups.find(ps => ps.is_default);
    return def ? def.supplier_id : (sups[0]?.supplier_id || "");
  };

  const getChosenSup = prod => orderSup[prod.id] || getDefaultSup(prod);

  const getPrice = (prod, sid) => {
    const ps = (prod.productSuppliers || []).find(x => x.supplier_id === sid);
    return ps?.price || 0;
  };

  const filtered = useMemo(() => products.filter(p => {
    if (fCat !== "all" && p.category !== fCat) return false;
    if (fSup !== "all") {
      const hasSup = (p.productSuppliers || []).some(ps => ps.supplier_id === fSup);
      if (!hasSup) return false;
    }
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [products, fCat, fSup, search]);

  const orderItems = useMemo(() =>
    Object.entries(orderQty)
      .filter(([, qty]) => parseFloat(qty) > 0)
      .map(([pid]) => {
        const prod = products.find(p => p.id === pid);
        if (!prod) return null;
        const sid = getChosenSup(prod);
        const qty = parseFloat(orderQty[pid]) || 0;
        const price = getPrice(prod, sid);
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
      supplierId: o.sid,
      supplierName: supMap[o.sid]?.name || "",
      qty: o.qty,
      orderUnit: o.prod.order_unit || "case",
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

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="flex items-center justify-between mb4">
        <div className="page-title">Count and Order</div>
        {itemCount > 0 && (
          <div className="flex items-center gap12">
            <div className="card" style={{ padding: "8px 16px" }}>
              <span className="text-muted text-xs">ORDER TOTAL</span>
              <div className="font-bold" style={{ fontSize: 18, color: "var(--green)" }}>{f$(totalCost)}</div>
            </div>
            <button className="btn btn-yellow btn-lg" onClick={() => setConfirming(true)}>
              Save Order ({itemCount} items)
            </button>
          </div>
        )}
      </div>
      <div className="page-sub">Enter stock on hand and qty to order for each product</div>

      <div className="filter-row">
        <input className="inp inp-sm" placeholder="Search product..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 200 }} />
        <select className="inp inp-sm" value={fCat} onChange={e => setFCat(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="all">All Categories</option>
          {CATS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="inp inp-sm" value={fSup} onChange={e => setFSup(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="all">All Suppliers</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {Object.values(orderQty).some(v => parseFloat(v) > 0) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setOrderQty({}); setStock({}); }}>
            Clear All
          </button>
        )}
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Count Note</th>
                <th>Unit</th>
                <th>Supplier</th>
                <th>Price/Unit</th>
                <th style={{ color: "var(--blue)", minWidth: 90 }}>Stock</th>
                <th style={{ color: "var(--green)", minWidth: 90 }}>Order Qty</th>
                <th style={{ color: "var(--navy)" }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const chosenSid = getChosenSup(p);
                const price = getPrice(p, chosenSid);
                const qty = parseFloat(orderQty[p.id]) || 0;
                const subtotal = qty * price;
                const hasOrder = qty > 0;
                const pSups = p.productSuppliers || [];
                return (
                  <tr key={p.id} style={{ background: hasOrder ? "rgba(0,137,123,.04)" : "" }}>
                    <td><div className="font-bold">{p.name}</div></td>
                    <td>
                      <span className="flex items-center gap4">
                        <span className="cat-dot" style={{ background: cClr(p.category) }} />
                        <span className="text-sm">{p.category}</span>
                      </span>
                    </td>
                    <td>
                      {p.count_note
                        ? <span className="text-xs font-mono" style={{ color: "var(--blue)", background: "var(--blue-dim)", padding: "2px 8px", borderRadius: 4 }}>{p.count_note}</span>
                        : <span className="text-muted text-xs">-</span>
                      }
                    </td>
                    <td className="font-mono text-xs text-muted">{p.order_unit || "case"}</td>
                    <td>
                      {pSups.length > 1 ? (
                        <select className="inp inp-sm" style={{ maxWidth: 130 }}
                          value={chosenSid}
                          onChange={e => setOrderSup(s => ({ ...s, [p.id]: e.target.value }))}>
                          {pSups.map(ps => (
                            <option key={ps.supplier_id} value={ps.supplier_id}>
                              {supMap[ps.supplier_id]?.name || ps.supplier_id}
                              {ps.is_default ? " (default)" : ""}
                            </option>
                          ))}
                        </select>
                      ) : pSups.length === 1 ? (
                        <span className="text-sm font-bold" style={{ color: sClr(suppliers, chosenSid) }}>
                          {supMap[chosenSid]?.name || "-"}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">No supplier</span>
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
                    <td className="font-mono font-bold" style={{ color: hasOrder ? "var(--green)" : "var(--muted)" }}>
                      {hasOrder ? f$(subtotal) : "-"}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
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
                    <div className="font-bold">{o.qty} {o.prod.order_unit || "case"}</div>
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
