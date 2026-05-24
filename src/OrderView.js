import { useState, useMemo } from "react";
import { f$, today, cClr, sClr } from "./constants";

function printPDF(order, suppliers, filterSid) {
  const supMap = Object.fromEntries(suppliers.map(s => [s.id, s]));
  const date = order.created_at ? order.created_at.slice(0, 10) : today();
  const allItems = (order.items || []).filter(it => !filterSid || it.supplierId === filterSid);

  const bySup = {};
  allItems.forEach(it => {
    if (!bySup[it.supplierId]) bySup[it.supplierId] = [];
    bySup[it.supplierId].push(it);
  });

  const byCat = sid => {
    const items = bySup[sid] || [];
    const cats = {};
    items.forEach(it => {
      if (!cats[it.category]) cats[it.category] = [];
      cats[it.category].push(it);
    });
    return cats;
  };

  let body = "";
  Object.keys(bySup).forEach(sid => {
    const sup = supMap[sid];
    const cats = byCat(sid);
    const supTotal = (bySup[sid] || []).reduce((a, b) => a + (b.subtotal || 0), 0);

    let rows = "";
    Object.entries(cats).forEach(([cat, items]) => {
      rows += "<tr><td colspan='5' style='background:#f0f4f8;padding:6px 12px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b90aa;'>" + cat + "</td></tr>";
      items.forEach(it => {
        rows +=
          "<tr>" +
          "<td style='padding:10px 12px;border-bottom:1px solid #e8f0f7;font-weight:600;color:#1a2f45;'>" + it.productName + "</td>" +
          "<td style='padding:10px 12px;border-bottom:1px solid #e8f0f7;color:#6b90aa;font-family:monospace;font-size:12px;'>" + (it.countNote || "-") + "</td>" +
          "<td style='padding:10px 12px;border-bottom:1px solid #e8f0f7;text-align:center;font-weight:700;'>" + it.qty + " " + (it.orderUnit || "case") + "</td>" +
          "<td style='padding:10px 12px;border-bottom:1px solid #e8f0f7;text-align:right;font-family:monospace;'>" + f$(it.price) + "</td>" +
          "<td style='padding:10px 12px;border-bottom:1px solid #e8f0f7;text-align:right;font-weight:700;color:#1a2f45;'>" + f$(it.subtotal) + "</td>" +
          "</tr>";
      });
    });

    body +=
      "<div style='page-break-after:always;padding:40px;'>" +
      "<div style='display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #1a2f45;'>" +
      "<div><div style='font-size:28px;font-weight:900;letter-spacing:2px;color:#1a2f45;'>LIGHTHOUSE</div>" +
      "<div style='font-size:10px;letter-spacing:3px;color:#6b90aa;margin-top:4px;text-transform:uppercase;'>Coastal Brasserie</div></div>" +
      "<div style='text-align:right;'><div style='font-size:22px;font-weight:800;color:#1a2f45;'>PURCHASE ORDER</div>" +
      "<div style='font-size:12px;color:#6b90aa;margin-top:4px;'>Date: " + date + "</div>" +
      "<div style='font-size:12px;color:#6b90aa;font-family:monospace;'>PO-" + Date.now().toString().slice(-6) + "</div></div>" +
      "</div>" +
      "<div style='display:flex;justify-content:space-between;margin-bottom:28px;'>" +
      "<div><div style='font-size:10px;font-weight:700;letter-spacing:2px;color:#6b90aa;text-transform:uppercase;margin-bottom:6px;'>From</div>" +
      "<div style='font-size:16px;font-weight:800;color:#1a2f45;'>Lighthouse Coastal Brasserie</div>" +
      "<div style='font-size:12px;color:#6b90aa;'>Food and Beverage Operations</div></div>" +
      "<div style='text-align:right;'><div style='font-size:10px;font-weight:700;letter-spacing:2px;color:#6b90aa;text-transform:uppercase;margin-bottom:6px;'>To</div>" +
      "<div style='font-size:16px;font-weight:800;color:#1a2f45;'>" + (sup?.name || "") + "</div>" +
      "<div style='font-size:12px;color:#6b90aa;'>" + (sup?.phone || "") + (sup?.phone && sup?.email ? " | " : "") + (sup?.email || "") + "</div></div>" +
      "</div>" +
      "<table style='width:100%;border-collapse:collapse;margin-bottom:20px;'>" +
      "<thead><tr style='background:#1a2f45;color:#fff;'>" +
      "<th style='padding:10px 12px;text-align:left;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;'>Product</th>" +
      "<th style='padding:10px 12px;text-align:left;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;'>How to Count</th>" +
      "<th style='padding:10px 12px;text-align:center;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;'>Quantity</th>" +
      "<th style='padding:10px 12px;text-align:right;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;'>Unit Price</th>" +
      "<th style='padding:10px 12px;text-align:right;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;'>Subtotal</th>" +
      "</tr></thead>" +
      "<tbody>" + rows +
      "<tr style='background:#1a2f45;color:#fff;'>" +
      "<td colspan='3' style='padding:12px;font-weight:800;font-size:14px;'>" + (bySup[sid] || []).length + " items</td>" +
      "<td style='padding:12px;text-align:right;font-size:12px;font-weight:700;'>TOTAL</td>" +
      "<td style='padding:12px;text-align:right;font-size:18px;font-weight:800;'>" + f$(supTotal) + "</td>" +
      "</tr></tbody></table>" +
      "<div style='padding:16px;background:#f0f4f8;border-radius:8px;font-size:12px;color:#6b90aa;margin-bottom:32px;'>" +
      "Please confirm order receipt and expected delivery date. Contact us for any questions or substitutions." +
      "</div>" +
      "<div style='display:flex;justify-content:space-between;padding-top:20px;border-top:1px solid #b8d0e8;'>" +
      "<div><div style='font-size:10px;color:#6b90aa;letter-spacing:1px;text-transform:uppercase;margin-bottom:28px;'>Ordered By</div>" +
      "<div style='border-top:1px solid #1a2f45;padding-top:6px;font-size:11px;color:#6b90aa;'>Lighthouse Food Guide</div></div>" +
      "<div style='text-align:right;'><div style='font-size:10px;color:#6b90aa;letter-spacing:1px;text-transform:uppercase;margin-bottom:28px;'>Supplier Confirmation</div>" +
      "<div style='border-top:1px solid #1a2f45;padding-top:6px;font-size:11px;color:#6b90aa;'>Signature / Date</div></div>" +
      "</div></div>";
  });

  const html =
    "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Purchase Order - " + date + "</title>" +
    "<style>* { box-sizing: border-box; } body { margin: 0; font-family: Arial, sans-serif; } @media print { body { margin: 0; } }</style>" +
    "</head><body>" + body + "</body></html>";

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  }
}

export default function OrderView({ orders, suppliers, updateOrder, showToast, isGM }) {
  const [selOrder, setSelOrder] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("current");

  const supMap = Object.fromEntries(suppliers.map(s => [s.id, s]));

  const currentOrder = useMemo(() =>
    orders.find(o => o.status === "draft") || null,
    [orders]
  );

  const historyOrders = useMemo(() =>
    orders.filter(o => o.status !== "draft")
      .sort((a, b) => b.created_at?.localeCompare(a.created_at)),
    [orders]
  );

  const startEdit = order => {
    setEditing(true);
    setEditItems(order.items.map(it => ({ ...it })));
  };

  const saveEdit = async () => {
    const order = selOrder || currentOrder;
    if (!order) return;
    setSaving(true);
    const total = editItems.reduce((a, b) => a + (b.subtotal || 0), 0);
    await updateOrder(order.id, { items: editItems, total_cost: total });
    setEditing(false);
    setSaving(false);
    showToast("Order updated");
  };

  const changeSupplier = (idx, newSid) => {
    setEditItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const newSup = suppliers.find(s => s.id === newSid);
      return { ...it, supplierId: newSid, supplierName: newSup?.name || "" };
    }));
  };

  const changeQty = (idx, val) => {
    setEditItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const qty = parseFloat(val) || 0;
      return { ...it, qty, subtotal: qty * (it.price || 0) };
    }));
  };

  const removeItem = idx => {
    setEditItems(prev => prev.filter((_, i) => i !== idx));
  };

  const markSent = async () => {
    if (!currentOrder) return;
    await updateOrder(currentOrder.id, { status: "sent" });
    showToast("Order marked as sent");
  };

  const bySup = items => {
    const map = {};
    (items || []).forEach(it => {
      if (!map[it.supplierId]) map[it.supplierId] = [];
      map[it.supplierId].push(it);
    });
    return map;
  };

  const byCat = items => {
    const map = {};
    (items || []).forEach(it => {
      if (!map[it.category]) map[it.category] = [];
      map[it.category].push(it);
    });
    return map;
  };

  const renderOrder = order => {
    const grouped = bySup(editing ? editItems : order.items);
    return Object.keys(grouped).map(sid => {
      const sup = supMap[sid];
      const items = grouped[sid];
      const supTotal = items.reduce((a, b) => a + (b.subtotal || 0), 0);
      const catGrouped = byCat(items);
      return (
        <div key={sid} className="card mb16">
          <div className="section-header">
            <span>{sup?.name || sid}</span>
            <span className="section-sub">{f$(supTotal)}</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "var(--muted)", letterSpacing: "1.5px", textTransform: "uppercase", borderBottom: "2px solid var(--border)", background: "var(--surface2)" }}>Product</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "var(--muted)", letterSpacing: "1.5px", textTransform: "uppercase", borderBottom: "2px solid var(--border)", background: "var(--surface2)" }}>Count Note</th>
                <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 10, color: "var(--muted)", letterSpacing: "1.5px", textTransform: "uppercase", borderBottom: "2px solid var(--border)", background: "var(--surface2)" }}>Qty</th>
                <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: "var(--muted)", letterSpacing: "1.5px", textTransform: "uppercase", borderBottom: "2px solid var(--border)", background: "var(--surface2)" }}>Price</th>
                <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: "var(--muted)", letterSpacing: "1.5px", textTransform: "uppercase", borderBottom: "2px solid var(--border)", background: "var(--surface2)" }}>Subtotal</th>
                {editing && <th style={{ padding: "8px 12px", background: "var(--surface2)", borderBottom: "2px solid var(--border)" }}></th>}
              </tr>
            </thead>
            <tbody>
              {Object.entries(catGrouped).map(([cat, catItems]) => (
                <>
                  <tr key={"cat-" + cat}>
                    <td colSpan={editing ? 6 : 5} style={{ padding: "6px 12px", background: "var(--surface2)", fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: cClr(cat) }}>
                      <span className="cat-dot" style={{ background: cClr(cat), marginRight: 6 }} />{cat}
                    </td>
                  </tr>
                  {catItems.map(it => {
                    const idx = editing ? editItems.findIndex(x => x.productId === it.productId && x.supplierId === it.supplierId) : -1;
                    const displayIt = editing && idx >= 0 ? editItems[idx] : it;
                    return (
                      <tr key={it.productId + it.supplierId}>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>
                          {editing && idx >= 0 ? (
                            <div>
                              <div className="font-bold">{it.productName}</div>
                              <select className="inp inp-sm mt4" style={{ maxWidth: 150 }}
                                value={displayIt.supplierId}
                                onChange={e => changeSupplier(idx, e.target.value)}>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                            </div>
                          ) : it.productName}
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", fontSize: 11, color: "var(--blue)", fontFamily: "monospace" }}>
                          {it.countNote || "-"}
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
                          {editing && idx >= 0 ? (
                            <input type="number" min={0} className="inp inp-sm inp-center" style={{ width: 70 }}
                              value={displayIt.qty}
                              onChange={e => changeQty(idx, e.target.value)} />
                          ) : (
                            <span className="font-bold">{it.qty} {it.orderUnit}</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", textAlign: "right", fontFamily: "monospace" }}>
                          {f$(displayIt.price)}
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", textAlign: "right", fontWeight: 700, color: "var(--navy)" }}>
                          {f$(displayIt.subtotal)}
                        </td>
                        {editing && idx >= 0 && (
                          <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
                            <button className="btn btn-red btn-xs" onClick={() => removeItem(idx)}>Del</button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end mt12 gap8">
            <button className="btn btn-orange btn-sm"
              onClick={() => printPDF(order, suppliers, sid)}>
              Print PDF - {sup?.name}
            </button>
          </div>
        </div>
      );
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb4">
        <div className="page-title">Order View</div>
        <div className="flex gap8">
          <button className={"btn btn-sm " + (view === "current" ? "btn-navy" : "btn-ghost")}
            onClick={() => { setView("current"); setSelOrder(null); setEditing(false); }}>
            Current Order
          </button>
          {isGM && (
            <button className={"btn btn-sm " + (view === "history" ? "btn-navy" : "btn-ghost")}
              onClick={() => { setView("history"); setSelOrder(null); setEditing(false); }}>
              Order History
            </button>
          )}
        </div>
      </div>

      {view === "current" && (
        <>
          <div className="page-sub">Items with order qty greater than 0 - grouped by supplier and category</div>
          {!currentOrder && (
            <div className="card" style={{ textAlign: "center", padding: 48 }}>
              <div className="font-bold" style={{ fontSize: 16, marginBottom: 8, color: "var(--navy)" }}>No active order</div>
              <div className="text-muted text-sm">Go to Count and Order to create an order.</div>
            </div>
          )}
          {currentOrder && (
            <>
              <div className="flex items-center justify-between mb16">
                <div className="flex items-center gap12">
                  <span className="badge badge-yellow">DRAFT</span>
                  <span className="text-muted text-sm">{currentOrder.items?.length} items</span>
                  <span className="font-bold" style={{ color: "var(--green)" }}>{f$(currentOrder.total_cost)}</span>
                </div>
                <div className="flex gap8">
                  {!editing ? (
                    <>
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(currentOrder)}>Edit Order</button>
                      <button className="btn btn-orange btn-sm" onClick={() => printPDF(currentOrder, suppliers, null)}>Print All PDFs</button>
                      <button className="btn btn-green btn-sm" onClick={markSent}>Mark as Sent</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                      <button className="btn btn-yellow btn-sm" disabled={saving} onClick={saveEdit}>
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {renderOrder(currentOrder)}
            </>
          )}
        </>
      )}

      {view === "history" && isGM && (
        <>
          <div className="page-sub">All past orders - click to view or reprint</div>
          {!selOrder ? (
            <div className="card">
              {!historyOrders.length && (
                <div style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>No order history yet</div>
              )}
              {historyOrders.map(o => (
                <div key={o.id} className="history-row" onClick={() => { setSelOrder(o); setEditing(false); }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold">{o.created_at?.slice(0, 10)}</div>
                      <div className="text-xs text-muted mt4">{o.items?.length} items - by {o.created_by}</div>
                    </div>
                    <div className="flex items-center gap12">
                      <span className="font-bold" style={{ color: "var(--green)" }}>{f$(o.total_cost)}</span>
                      <span className={"badge badge-" + (o.status === "sent" ? "green" : o.status === "draft" ? "yellow" : "blue")}>{o.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap8 mb16">
                <button className="btn btn-ghost btn-sm" onClick={() => { setSelOrder(null); setEditing(false); }}>Back</button>
                <span className="font-bold" style={{ fontSize: 16 }}>Order - {selOrder.created_at?.slice(0, 10)}</span>
                <span className={"badge badge-" + (selOrder.status === "sent" ? "green" : "yellow")}>{selOrder.status}</span>
                <span className="font-bold" style={{ color: "var(--green)" }}>{f$(selOrder.total_cost)}</span>
              </div>
              <div className="flex gap8 mb16">
                {!editing ? (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(selOrder)}>Edit</button>
                    <button className="btn btn-orange btn-sm" onClick={() => printPDF(selOrder, suppliers, null)}>Print All PDFs</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                    <button className="btn btn-yellow btn-sm" disabled={saving} onClick={saveEdit}>
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                )}
              </div>
              {renderOrder(selOrder)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
