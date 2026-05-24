import { useState, useRef } from "react";
import { CATS, uid, f$, cClr, sClr } from "./constants";

export default function Manage({ staff, products, suppliers, saveStaff, delStaff, saveProd, delProd, saveSupplier, delSupplier, saveProductSupplier, delProductSupplier, importProducts, showToast }) {
  const [tab, setTab] = useState("staff");
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [csvRows, setCsvRows] = useState([]);
  const fileRef = useRef();

  const [staffForm, setStaffForm] = useState({ name: "", pin: "", role: "staff", can_count: true, can_order: true, can_history: false, can_manage: false });
  const [prodForm, setProdForm] = useState({ name: "", category: "Produce", count_note: "", order_unit: "case", count_unit: "each", conv_factor: 1, par: 0, price_per_order: 0, price_per_count: 0, default_supplier_id: "", supplier_ids: [] });
  const [supForm, setSupForm] = useState({ name: "", phone: "", email: "", contact: "" });

  const openStaff = s => {
    setEditing(s);
    setStaffForm(s
      ? { name: s.name, pin: s.pin, role: s.role, can_count: s.can_count, can_order: s.can_order, can_history: s.can_history, can_manage: s.can_manage }
      : { name: "", pin: "", role: "staff", can_count: true, can_order: true, can_history: false, can_manage: false });
    setModal("staff");
  };

  const openProd = p => {
    setEditing(p);
    const pSups = p ? (p.productSuppliers || []) : [];
    const defaultSup = pSups.find(ps => ps.is_default);
    setProdForm(p ? {
      name: p.name, category: p.category, count_note: p.count_note || "",
      order_unit: p.order_unit || "case", count_unit: p.count_unit || "each",
      conv_factor: p.conv_factor || 1, par: p.par || 0,
      price_per_order: p.price_per_order || 0,
      price_per_count: p.price_per_count || 0,
      default_supplier_id: defaultSup?.supplier_id || pSups[0]?.supplier_id || "",
      supplier_ids: pSups.map(ps => ps.supplier_id),
    } : {
      name: "", category: "Produce", count_note: "",
      order_unit: "case", count_unit: "each", conv_factor: 1, par: 0,
      price_per_order: 0, price_per_count: 0,
      default_supplier_id: "", supplier_ids: [],
    });
    setModal("prod");
  };

  const openSup = s => {
    setEditing(s);
    setSupForm(s
      ? { name: s.name, phone: s.phone || "", email: s.email || "", contact: s.contact || "" }
      : { name: "", phone: "", email: "", contact: "" });
    setModal("sup");
  };

  const toggleSupplier = sid => {
    setProdForm(f => {
      const has = f.supplier_ids.includes(sid);
      const newIds = has ? f.supplier_ids.filter(x => x !== sid) : [...f.supplier_ids, sid];
      const newDefault = f.default_supplier_id === sid && has
        ? (newIds[0] || "")
        : (newIds.length === 1 ? newIds[0] : f.default_supplier_id);
      return { ...f, supplier_ids: newIds, default_supplier_id: newDefault };
    });
  };

  const autoCalcCount = () => {
    const op = parseFloat(prodForm.price_per_order) || 0;
    const cf = parseFloat(prodForm.conv_factor) || 1;
    if (op && cf) setProdForm(f => ({ ...f, price_per_count: parseFloat((op / cf).toFixed(4)) }));
  };

  const handleSaveStaff = async () => {
    if (!staffForm.name || !staffForm.pin) return;
    if (staffForm.pin.length !== 4) { showToast("PIN must be 4 digits", true); return; }
    setSaving(true);
    await saveStaff({ ...staffForm, id: editing?.id || uid() });
    setModal(null); setEditing(null); setSaving(false);
    showToast("Staff saved");
  };

  const handleSaveProd = async () => {
    if (!prodForm.name) return;
    setSaving(true);
    const prodId = editing?.id || uid();
    await saveProd({
      id: prodId, name: prodForm.name, category: prodForm.category,
      count_note: prodForm.count_note, order_unit: prodForm.order_unit,
      count_unit: prodForm.count_unit, conv_factor: parseFloat(prodForm.conv_factor) || 1,
      par: parseFloat(prodForm.par) || 0,
      price_per_order: parseFloat(prodForm.price_per_order) || 0,
      price_per_count: parseFloat(prodForm.price_per_count) || 0,
    });
    const oldSups = editing?.productSuppliers || [];
    for (const ps of oldSups) {
      if (!prodForm.supplier_ids.includes(ps.supplier_id)) {
        await delProductSupplier(ps.id);
      }
    }
    for (const sid of prodForm.supplier_ids) {
      const existing = oldSups.find(ps => ps.supplier_id === sid);
      if (!existing) {
        await saveProductSupplier({
          id: uid(), product_id: prodId, supplier_id: sid,
          price: parseFloat(prodForm.price_per_order) || 0,
          price_per_order: parseFloat(prodForm.price_per_order) || 0,
          price_per_count: parseFloat(prodForm.price_per_count) || 0,
          is_default: sid === prodForm.default_supplier_id,
        });
      } else if (existing.is_default !== (sid === prodForm.default_supplier_id)) {
        await saveProductSupplier({
          ...existing,
          is_default: sid === prodForm.default_supplier_id,
          price: parseFloat(prodForm.price_per_order) || 0,
          price_per_order: parseFloat(prodForm.price_per_order) || 0,
          price_per_count: parseFloat(prodForm.price_per_count) || 0,
        });
      }
    }
    setModal(null); setEditing(null); setSaving(false);
    showToast("Product saved");
  };

  const handleSaveSup = async () => {
    if (!supForm.name) return;
    setSaving(true);
    await saveSupplier({ ...supForm, id: editing?.id || uid() });
    setModal(null); setEditing(null); setSaving(false);
    showToast("Supplier saved");
  };

  const handleCSV = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = ev.target.result.split("\n").map(l => l.trim()).filter(Boolean);
      const hdrs = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""));
      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
        const row = Object.fromEntries(hdrs.map((h, j) => [h, vals[j] || ""]));
        const po = parseFloat(row["price per order"] || row["price_per_order"] || row["price"] || "0") || 0;
        const cf = parseFloat(row["conversion factor"] || row["conv_factor"] || "1") || 1;
        const pc = parseFloat(row["price per count"] || row["price_per_count"] || "0") || (po > 0 ? parseFloat((po / cf).toFixed(4)) : 0);
        return {
          id: uid(),
          name: row["product name"] || row["name"] || "",
          category: row["category"] || "Other",
          count_note: row["count note"] || row["count_note"] || "",
          order_unit: row["order unit"] || row["order_unit"] || row["unit"] || "case",
          count_unit: row["count unit"] || row["count_unit"] || "each",
          conv_factor: cf, par: parseFloat(row["par"]) || 0,
          price_per_order: po, price_per_count: pc,
        };
      }).filter(r => r.name);
      setCsvRows(rows);
      setModal("csv");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const doImport = async () => {
    setSaving(true);
    await importProducts(csvRows);
    setCsvRows([]);
    setModal(null);
    setSaving(false);
    showToast("Imported " + csvRows.length + " products");
  };

  const TABS = [
    { id: "staff", label: "Staff and Access" },
    { id: "products", label: "Products" },
    { id: "suppliers", label: "Suppliers" },
  ];

  return (
    <div>
      <div className="page-title">Management</div>
      <div className="page-sub">GM access only</div>

      <div className="flex gap8 mb20">
        {TABS.map(t => (
          <button key={t.id} className={"btn btn-sm " + (tab === t.id ? "btn-navy" : "btn-ghost")} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "staff" && (
        <div>
          <div className="flex justify-between items-center mb12">
            <div className="card-hd" style={{ marginBottom: 0 }}>Staff Members</div>
            <button className="btn btn-yellow btn-sm" onClick={() => openStaff(null)}>+ Add Staff</button>
          </div>
          <div className="card">
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>PIN</th><th>Role</th><th>Count</th><th>Order</th><th>History</th><th>Manage</th><th></th></tr>
                </thead>
                <tbody>
                  {staff.map(s => (
                    <tr key={s.id}>
                      <td className="font-bold">{s.name}</td>
                      <td className="font-mono">{s.pin}</td>
                      <td><span className={"badge badge-" + (s.role === "gm" ? "navy" : "gray")}>{s.role}</span></td>
                      <td>{s.can_count ? <span className="badge badge-green">Yes</span> : <span className="badge badge-gray">No</span>}</td>
                      <td>{s.can_order ? <span className="badge badge-green">Yes</span> : <span className="badge badge-gray">No</span>}</td>
                      <td>{s.can_history ? <span className="badge badge-green">Yes</span> : <span className="badge badge-gray">No</span>}</td>
                      <td>{s.can_manage ? <span className="badge badge-green">Yes</span> : <span className="badge badge-gray">No</span>}</td>
                      <td>
                        <div className="flex gap4">
                          <button className="btn btn-ghost btn-xs" onClick={() => openStaff(s)}>Edit</button>
                          {s.role !== "gm" && <button className="btn btn-red btn-xs" onClick={() => delStaff(s.id)}>Del</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "products" && (
        <div>
          <div className="flex justify-between items-center mb12">
            <div className="card-hd" style={{ marginBottom: 0 }}>{products.length} Products</div>
            <div className="flex gap8">
              <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current.click()}>Import CSV</button>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSV} />
              <button className="btn btn-yellow btn-sm" onClick={() => openProd(null)}>+ Add Product</button>
            </div>
          </div>
          <div className="card mb12" style={{ background: "var(--surface2)", padding: "12px 16px" }}>
            <div className="text-xs font-bold text-muted mb4">CSV FORMAT</div>
            <div className="font-mono text-xs" style={{ color: "var(--navy)" }}>
              product name, category, count note, order unit, count unit, conversion factor, par, price per order, price per count
            </div>
          </div>
          <div className="card">
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th><th>Category</th><th>Count Note</th><th>Units</th>
                    <th>Price/CS</th><th>Price/Count</th><th>Par</th>
                    <th>Default Supplier</th><th>Also From</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const pSups = p.productSuppliers || [];
                    const defSup = pSups.find(ps => ps.is_default) || pSups[0];
                    const otherSups = pSups.filter(ps => ps.id !== defSup?.id);
                    return (
                      <tr key={p.id}>
                        <td className="font-bold">{p.name}</td>
                        <td><span className="flex items-center gap4"><span className="cat-dot" style={{ background: cClr(p.category) }} />{p.category}</span></td>
                        <td className="text-xs font-mono" style={{ color: "var(--blue)" }}>{p.count_note || "-"}</td>
                        <td className="font-mono text-xs text-muted">
                          {p.order_unit}/{p.count_unit}
                          <div style={{ fontSize: 10, color: "var(--muted)" }}>x{p.conv_factor}</div>
                        </td>
                        <td className="font-mono font-bold" style={{ color: "var(--navy)" }}>{p.price_per_order > 0 ? f$(p.price_per_order) : <span className="text-muted">-</span>}</td>
                        <td className="font-mono" style={{ color: "var(--green)" }}>{p.price_per_count > 0 ? f$(p.price_per_count) : <span className="text-muted">-</span>}</td>
                        <td className="font-mono text-xs">{p.par} {p.count_unit}</td>
                        <td>{defSup ? <span className="badge badge-yellow">{suppliers.find(s => s.id === defSup.supplier_id)?.name || "-"}</span> : <span className="text-muted text-xs">Not set</span>}</td>
                        <td>{otherSups.map(ps => <span key={ps.id} className="badge badge-gray" style={{ marginRight: 4 }}>{suppliers.find(s => s.id === ps.supplier_id)?.name || "-"}</span>)}</td>
                        <td>
                          <div className="flex gap4">
                            <button className="btn btn-ghost btn-xs" onClick={() => openProd(p)}>Edit</button>
                            <button className="btn btn-red btn-xs" onClick={() => delProd(p.id)}>Del</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {products.length === 0 && (
                    <tr><td colSpan={10} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>No products yet - import CSV or add manually</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "suppliers" && (
        <div>
          <div className="flex justify-between items-center mb12">
            <div className="card-hd" style={{ marginBottom: 0 }}>{suppliers.length} Suppliers</div>
            <button className="btn btn-yellow btn-sm" onClick={() => openSup(null)}>+ Add Supplier</button>
          </div>
          <div className="g2 gap16">
            {suppliers.map(s => (
              <div key={s.id} className="card" style={{ borderLeft: "3px solid " + sClr(suppliers, s.id) }}>
                <div className="flex justify-between items-start mb8">
                  <div>
                    <div className="font-bold" style={{ fontSize: 16, color: sClr(suppliers, s.id) }}>{s.name}</div>
                    {s.contact && <div className="text-sm text-muted mt4">{s.contact}</div>}
                    {s.phone && <div className="text-sm text-muted">{s.phone}</div>}
                    {s.email && <div className="text-xs text-muted">{s.email}</div>}
                  </div>
                  <div className="flex gap4">
                    <button className="btn btn-ghost btn-sm" onClick={() => openSup(s)}>Edit</button>
                    <button className="btn btn-red btn-sm" onClick={() => delSupplier(s.id)}>Del</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal === "staff" && (
        <div className="overlay"><div className="modal">
          <div className="modal-title">{editing ? "Edit Staff" : "Add Staff Member"}</div>
          <div className="flex flex-col gap12 mb16">
            <div className="fg"><label className="lbl">Full Name</label>
              <input className="inp" value={staffForm.name} onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="fg"><label className="lbl">4-Digit PIN</label>
              <input className="inp" type="number" value={staffForm.pin}
                onChange={e => setStaffForm(f => ({ ...f, pin: e.target.value.slice(0, 4) }))} placeholder="0000" />
            </div>
            <div className="fg"><label className="lbl">Role</label>
              <select className="inp" value={staffForm.role} onChange={e => setStaffForm(f => ({ ...f, role: e.target.value }))}>
                <option value="staff">Staff</option>
                <option value="gm">GM</option>
              </select>
            </div>
          </div>
          <div className="card-hd mb8">Page Access</div>
          <div className="flex flex-col gap8 mb16">
            {[
              { key: "can_count", label: "Count and Order (Page 1)" },
              { key: "can_order", label: "Order View (Page 2)" },
              { key: "can_history", label: "Order History" },
              { key: "can_manage", label: "Management (Page 3)" },
            ].map(item => (
              <label key={item.key} className="flex items-center gap8" style={{ cursor: "pointer", fontWeight: 600 }}>
                <input type="checkbox" checked={staffForm[item.key]}
                  onChange={e => setStaffForm(f => ({ ...f, [item.key]: e.target.checked }))} />
                {item.label}
              </label>
            ))}
          </div>
          <div className="flex justify-end gap8">
            <button className="btn btn-ghost" onClick={() => { setModal(null); setEditing(null); }}>Cancel</button>
            <button className="btn btn-yellow" disabled={saving} onClick={handleSaveStaff}>{saving ? "Saving..." : "Save"}</button>
          </div>
        </div></div>
      )}

      {modal === "prod" && (
        <div className="overlay"><div className="modal" style={{ maxWidth: 680 }}>
          <div className="modal-title">{editing ? "Edit Product" : "Add Product"}</div>
          <div className="g2 gap12 mb16">
            <div className="fg"><label className="lbl">Product Name</label>
              <input className="inp" value={prodForm.name} onChange={e => setProdForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="fg"><label className="lbl">Category</label>
              <select className="inp" value={prodForm.category} onChange={e => setProdForm(f => ({ ...f, category: e.target.value }))}>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="fg" style={{ gridColumn: "1/-1" }}>
              <label className="lbl">Count Note</label>
              <input className="inp" value={prodForm.count_note}
                onChange={e => setProdForm(f => ({ ...f, count_note: e.target.value }))}
                placeholder="e.g. Count by lb, Count each piece, Count full cases only..." />
            </div>
            <div className="fg"><label className="lbl">Order Unit (how you buy)</label>
              <input className="inp" value={prodForm.order_unit}
                onChange={e => setProdForm(f => ({ ...f, order_unit: e.target.value }))} placeholder="case, bag, gal..." />
            </div>
            <div className="fg"><label className="lbl">Count Unit (how you count)</label>
              <input className="inp" value={prodForm.count_unit}
                onChange={e => setProdForm(f => ({ ...f, count_unit: e.target.value }))} placeholder="lb, each, oz..." />
            </div>
            <div className="fg">
              <label className="lbl">Conversion Factor</label>
              <input className="inp" type="number" step="0.01" value={prodForm.conv_factor}
                onChange={e => setProdForm(f => ({ ...f, conv_factor: parseFloat(e.target.value) || 1 }))} />
              <span className="text-xs text-muted mt4">1 {prodForm.order_unit} = {prodForm.conv_factor} {prodForm.count_unit}</span>
            </div>
            <div className="fg"><label className="lbl">Par (in {prodForm.count_unit})</label>
              <input className="inp" type="number" value={prodForm.par}
                onChange={e => setProdForm(f => ({ ...f, par: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="divider" />
          <div className="card-hd mb8">Prices (reference only)</div>
          <div className="g2 gap12 mb16">
            <div className="fg">
              <label className="lbl">Price per {prodForm.order_unit} (CS price)</label>
              <div className="flex gap8">
                <input className="inp" type="number" step="0.01" value={prodForm.price_per_order}
                  onChange={e => setProdForm(f => ({ ...f, price_per_order: parseFloat(e.target.value) || 0 }))} />
                <button className="btn btn-ghost btn-sm" onClick={autoCalcCount} style={{ whiteSpace: "nowrap" }}>Calc</button>
              </div>
            </div>
            <div className="fg">
              <label className="lbl">Price per {prodForm.count_unit} (stock value)</label>
              <input className="inp" type="number" step="0.0001" value={prodForm.price_per_count}
                onChange={e => setProdForm(f => ({ ...f, price_per_count: parseFloat(e.target.value) || 0 }))} />
              {prodForm.price_per_order > 0 && (
                <span className="text-xs text-muted mt4">Auto: {f$(prodForm.price_per_order / (prodForm.conv_factor || 1))} per {prodForm.count_unit}</span>
              )}
            </div>
          </div>
          <div className="divider" />
          <div className="card-hd mb8">Suppliers — check all that carry this product</div>
          <div className="flex flex-col gap8 mb16">
            {suppliers.map(s => {
              const isSelected = prodForm.supplier_ids.includes(s.id);
              const isDefault = prodForm.default_supplier_id === s.id;
              return (
                <div key={s.id} className="card" style={{ padding: "10px 14px", background: isSelected ? "var(--surface2)" : "var(--bg)", border: "1px solid " + (isSelected ? sClr(suppliers, s.id) : "var(--border)") }}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap8" style={{ cursor: "pointer" }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSupplier(s.id)} />
                      <span className="font-bold" style={{ color: isSelected ? sClr(suppliers, s.id) : "var(--text2)" }}>{s.name}</span>
                    </label>
                    {isSelected && (
                      <label className="flex items-center gap6 text-xs" style={{ cursor: "pointer" }}>
                        <input type="radio" checked={isDefault}
                          onChange={() => setProdForm(f => ({ ...f, default_supplier_id: s.id }))} />
                        <span className="font-bold" style={{ color: "var(--yellow)" }}>DEFAULT</span>
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
            {suppliers.length === 0 && <div className="text-muted text-sm">No suppliers yet - add in Suppliers tab first</div>}
          </div>
          <div className="flex justify-end gap8 mt16">
            <button className="btn btn-ghost" onClick={() => { setModal(null); setEditing(null); }}>Cancel</button>
            <button className="btn btn-yellow" disabled={saving} onClick={handleSaveProd}>{saving ? "Saving..." : "Save Product"}</button>
          </div>
        </div></div>
      )}

      {modal === "sup" && (
        <div className="overlay"><div className="modal">
          <div className="modal-title">{editing ? "Edit Supplier" : "Add Supplier"}</div>
          <div className="flex flex-col gap12 mb16">
            <div className="fg"><label className="lbl">Company Name</label>
              <input className="inp" value={supForm.name} onChange={e => setSupForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="fg"><label className="lbl">Contact Person</label>
              <input className="inp" value={supForm.contact} onChange={e => setSupForm(f => ({ ...f, contact: e.target.value }))} />
            </div>
            <div className="fg"><label className="lbl">Phone</label>
              <input className="inp" value={supForm.phone} onChange={e => setSupForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="fg"><label className="lbl">Email</label>
              <input className="inp" value={supForm.email} onChange={e => setSupForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap8">
            <button className="btn btn-ghost" onClick={() => { setModal(null); setEditing(null); }}>Cancel</button>
            <button className="btn btn-yellow" disabled={saving} onClick={handleSaveSup}>{saving ? "Saving..." : "Save"}</button>
          </div>
        </div></div>
      )}

      {modal === "csv" && (
        <div className="overlay"><div className="modal" style={{ maxWidth: 800 }}>
          <div className="modal-title">CSV Preview - {csvRows.length} products</div>
          <div className="text-xs text-muted mb12">After import - edit each product to assign suppliers</div>
          <div className="tbl-wrap" style={{ maxHeight: 360, overflowY: "auto" }}>
            <table>
              <thead>
                <tr><th>Name</th><th>Category</th><th>Count Note</th><th>Order Unit</th><th>Count Unit</th><th>Conv.</th><th>Par</th><th>Price/CS</th><th>Price/Count</th></tr>
              </thead>
              <tbody>
                {csvRows.map((r, i) => (
                  <tr key={i}>
                    <td className="font-bold">{r.name}</td>
                    <td><span className="flex items-center gap4"><span className="cat-dot" style={{ background: cClr(r.category) }} />{r.category}</span></td>
                    <td className="text-xs font-mono" style={{ color: "var(--blue)" }}>{r.count_note || "-"}</td>
                    <td className="font-mono text-xs">{r.order_unit}</td>
                    <td className="font-mono text-xs">{r.count_unit}</td>
                    <td className="font-mono text-xs">x{r.conv_factor}</td>
                    <td className="font-mono text-xs">{r.par}</td>
                    <td className="font-mono text-xs">{r.price_per_order > 0 ? f$(r.price_per_order) : "-"}</td>
                    <td className="font-mono text-xs">{r.price_per_count > 0 ? f$(r.price_per_count) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap8 mt16">
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-yellow" disabled={saving} onClick={doImport}>
              {saving ? "Importing..." : "Import All " + csvRows.length + " Products"}
            </button>
          </div>
        </div></div>
      )}
    </div>
  );
}
