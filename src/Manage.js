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
  const [prodForm, setProdForm] = useState({ name: "", category: "Produce", count_note: "", order_unit: "case", count_unit: "each", conv_factor: 1, par: 0 });
  const [supForm, setSupForm] = useState({ name: "", phone: "", email: "", contact: "" });
  const [pSupForm, setPSupForm] = useState({ supplier_id: "", price_per_order: "", price_per_count: "", is_default: false });
  const [selProd, setSelProd] = useState(null);
  const [autoCalc, setAutoCalc] = useState(true);

  const openStaff = s => {
    setEditing(s);
    setStaffForm(s
      ? { name: s.name, pin: s.pin, role: s.role, can_count: s.can_count, can_order: s.can_order, can_history: s.can_history, can_manage: s.can_manage }
      : { name: "", pin: "", role: "staff", can_count: true, can_order: true, can_history: false, can_manage: false });
    setModal("staff");
  };

  const openProd = p => {
    setEditing(p);
    setProdForm(p
      ? { name: p.name, category: p.category, count_note: p.count_note || "", order_unit: p.order_unit || "case", count_unit: p.count_unit || "each", conv_factor: p.conv_factor || 1, par: p.par || 0 }
      : { name: "", category: "Produce", count_note: "", order_unit: "case", count_unit: "each", conv_factor: 1, par: 0 });
    setModal("prod");
  };

  const openSup = s => {
    setEditing(s);
    setSupForm(s
      ? { name: s.name, phone: s.phone || "", email: s.email || "", contact: s.contact || "" }
      : { name: "", phone: "", email: "", contact: "" });
    setModal("sup");
  };

  const openProdSup = p => {
    setSelProd(p);
    setPSupForm({ supplier_id: suppliers[0]?.id || "", price_per_order: "", price_per_count: "", is_default: (p.productSuppliers || []).length === 0 });
    setAutoCalc(true);
    setModal("prodsup");
  };

  const editProdSup = (p, ps) => {
    setSelProd(p);
    setPSupForm({
      supplier_id: ps.supplier_id,
      price_per_order: ps.price_per_order || ps.price || "",
      price_per_count: ps.price_per_count || "",
      is_default: ps.is_default,
      editId: ps.id,
    });
    setAutoCalc(!ps.price_per_count);
    setModal("prodsup");
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
    await saveProd({ ...prodForm, id: editing?.id || uid() });
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

  const handleSaveProdSup = async () => {
    if (!pSupForm.supplier_id || !pSupForm.price_per_order) return;
    setSaving(true);
    const pricePerOrder = parseFloat(pSupForm.price_per_order) || 0;
    const pricePerCount = autoCalc
      ? parseFloat((pricePerOrder / (parseFloat(selProd.conv_factor) || 1)).toFixed(4)) || 0
      : parseFloat(pSupForm.price_per_count) || 0;
    const data = {
      id: pSupForm.editId || uid(),
      product_id: selProd.id,
      supplier_id: pSupForm.supplier_id,
      price: pricePerOrder,
      price_per_order: pricePerOrder,
      price_per_count: pricePerCount,
      is_default: pSupForm.is_default,
    };
    if (pSupForm.is_default) {
      for (const ps of (selProd.productSuppliers || []).filter(x => x.id !== pSupForm.editId)) {
        await saveProductSupplier({ ...ps, is_default: false });
      }
    }
    await saveProductSupplier(data);
    setPSupForm({ supplier_id: suppliers[0]?.id || "", price_per_order: "", price_per_count: "", is_default: false });
    setSaving(false);
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
        return {
          id: uid(),
          name: row["product name"] || row["name"] || "",
          category: row["category"] || "Other",
          count_note: row["count note"] || row["count_note"] || "",
          order_unit: row["order unit"] || row["order_unit"] || row["unit"] || "case",
          count_unit: row["count unit"] || row["count_unit"] || "each",
          conv_factor: parseFloat(row["conversion factor"] || row["conv_factor"] || "1") || 1,
          par: parseFloat(row["par"]) || 0,
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
                  <tr>
                    <th>Name</th><th>PIN</th><th>Role</th>
                    <th>Count</th><th>Order</th><th>History</th><th>Manage</th><th></th>
                  </tr>
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
              product name, category, count note, order unit, count unit, conversion factor, par
            </div>
            <div className="text-xs text-muted mt4">After import - click each product to add suppliers and prices</div>
          </div>
          <div className="card">
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th><th>Category</th><th>Count Note</th>
                    <th>Order Unit</th><th>Count Unit</th><th>Conv.</th><th>Par</th>
                    <th>Suppliers and Prices</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td className="font-bold">{p.name}</td>
                      <td>
                        <span className="flex items-center gap4">
                          <span className="cat-dot" style={{ background: cClr(p.category) }} />
                          {p.category}
                        </span>
                      </td>
                      <td className="text-xs font-mono" style={{ color: "var(--blue)" }}>{p.count_note || "-"}</td>
                      <td className="font-mono text-xs text-muted">{p.order_unit}</td>
                      <td className="font-mono text-xs text-muted">{p.count_unit}</td>
                      <td className="font-mono text-xs text-muted">x{p.conv_factor}</td>
                      <td className="font-mono text-xs">{p.par} {p.count_unit}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {(p.productSuppliers || []).map(ps => {
                            const sup = suppliers.find(s => s.id === ps.supplier_id);
                            return (
                              <div key={ps.id} className="flex items-center gap6">
                                {ps.is_default && <span className="badge badge-yellow" style={{ fontSize: 9, padding: "1px 5px" }}>DEFAULT</span>}
                                <span style={{ fontSize: 12, fontWeight: 700, color: sClr(suppliers, ps.supplier_id) }}>{sup?.name}</span>
                                <span className="text-xs text-muted">{f$(ps.price_per_order || ps.price)}/{p.order_unit}</span>
                                <span className="text-xs" style={{ color: "var(--green)" }}>{f$(ps.price_per_count)}/{p.count_unit}</span>
                                <button className="btn btn-ghost btn-xs" onClick={() => editProdSup(p, ps)}>Edit</button>
                                <button className="btn btn-red btn-xs" onClick={() => delProductSupplier(ps.id)}>x</button>
                              </div>
                            );
                          })}
                          <button className="btn btn-ghost btn-xs" style={{ alignSelf: "flex-start" }} onClick={() => openProdSup(p)}>+ Add Supplier</button>
                        </div>
                      </td>
                      <td>
                        <div className="flex gap4">
                          <button className="btn btn-ghost btn-xs" onClick={() => openProd(p)}>Edit</button>
                          <button className="btn btn-red btn-xs" onClick={() => delProd(p.id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>No products yet - import CSV or add manually</td></tr>
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
        <div className="overlay"><div className="modal" style={{ maxWidth: 640 }}>
          <div className="modal-title">{editing ? "Edit Product" : "Add Product"}</div>
          <div className="g2 gap12 mb16">
            <div className="fg"><label className="lbl">Product Name</label>
              <input className="inp" value={prodForm.name} onChange={e => setProdForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="fg"><label className="lbl">Category</label>
              <select className="inp" value={prodForm.category} onChange={e => setProdForm(f => ({ ...f, category: e.target.value }))}>
                {CATS.map(c => <option key={c}>{c}</option>)}
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
          <div className="flex justify-end gap8">
            <button className="btn btn-ghost" onClick={() => { setModal(null); setEditing(null); }}>Cancel</button>
            <button className="btn btn-yellow" disabled={saving} onClick={handleSaveProd}>{saving ? "Saving..." : "Save"}</button>
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

      {modal === "prodsup" && selProd && (
        <div className="overlay"><div className="modal" style={{ maxWidth: 560 }}>
          <div className="modal-title">
            {pSupForm.editId ? "Edit Supplier Price" : "Add Supplier"} - {selProd.name}
          </div>
          <div className="card mb16" style={{ background: "var(--surface2)", padding: "10px 14px" }}>
            <div className="text-xs text-muted">1 {selProd.order_unit} = {selProd.conv_factor} {selProd.count_unit}</div>
          </div>
          <div className="flex flex-col gap12 mb16">
            <div className="fg"><label className="lbl">Supplier</label>
              <select className="inp" value={pSupForm.supplier_id}
                onChange={e => setPSupForm(f => ({ ...f, supplier_id: e.target.value }))}>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="lbl">Price per {selProd.order_unit} (what you pay when ordering)</label>
              <input className="inp" type="number" step="0.01" value={pSupForm.price_per_order}
                onChange={e => setPSupForm(f => ({ ...f, price_per_order: e.target.value }))}
                placeholder="e.g. 95.00" />
            </div>
            <div className="card" style={{ background: "var(--surface2)", padding: "12px 14px" }}>
              <div className="flex items-center justify-between mb8">
                <label className="lbl" style={{ marginBottom: 0 }}>Price per {selProd.count_unit} (used for stock value)</label>
                <label className="flex items-center gap6 text-xs" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={autoCalc} onChange={e => setAutoCalc(e.target.checked)} />
                  Auto-calculate
                </label>
              </div>
              {autoCalc ? (
                <div className="inp" style={{ background: "var(--surface3)", color: "var(--green)", fontWeight: 700 }}>
                  {pSupForm.price_per_order
                    ? f$(parseFloat(pSupForm.price_per_order) / (parseFloat(selProd.conv_factor) || 1)) + " per " + selProd.count_unit
                    : "Enter order price above first"}
                </div>
              ) : (
                <input className="inp" type="number" step="0.0001" value={pSupForm.price_per_count}
                  onChange={e => setPSupForm(f => ({ ...f, price_per_count: e.target.value }))}
                  placeholder="Enter manually" />
              )}
            </div>
            <label className="flex items-center gap8" style={{ cursor: "pointer", fontWeight: 600 }}>
              <input type="checkbox" checked={pSupForm.is_default}
                onChange={e => setPSupForm(f => ({ ...f, is_default: e.target.checked }))} />
              Set as DEFAULT supplier for this product
            </label>
          </div>
          <div className="divider" />
          <div className="card-hd mb8">All Suppliers for {selProd.name}</div>
          {(selProd.productSuppliers || []).length === 0 && (
            <div className="text-muted text-sm mb12">No suppliers added yet</div>
          )}
          {(selProd.productSuppliers || []).map(ps => {
            const sup = suppliers.find(s => s.id === ps.supplier_id);
            return (
              <div key={ps.id} className="flex justify-between items-center mb8 card" style={{ background: "var(--surface2)", padding: "8px 12px" }}>
                <div>
                  <div className="flex items-center gap6">
                    {ps.is_default && <span className="badge badge-yellow" style={{ fontSize: 9 }}>DEFAULT</span>}
                    <span className="font-bold" style={{ color: sClr(suppliers, ps.supplier_id) }}>{sup?.name}</span>
                  </div>
                  <div className="flex gap8 mt4">
                    <span className="text-xs text-muted">{f$(ps.price_per_order || ps.price)}/{selProd.order_unit}</span>
                    <span className="text-xs" style={{ color: "var(--green)" }}>{f$(ps.price_per_count)}/{selProd.count_unit}</span>
                  </div>
                </div>
                <div className="flex gap4">
                  <button className="btn btn-ghost btn-xs" onClick={() => editProdSup(selProd, ps)}>Edit</button>
                  <button className="btn btn-red btn-xs" onClick={() => delProductSupplier(ps.id)}>Remove</button>
                </div>
              </div>
            );
          })}
          <div className="flex justify-end gap8 mt16">
            <button className="btn btn-ghost" onClick={() => { setModal(null); setSelProd(null); }}>Close</button>
            <button className="btn btn-yellow" disabled={saving} onClick={handleSaveProdSup}>
              {saving ? "Saving..." : pSupForm.editId ? "Save Changes" : "Add Supplier"}
            </button>
          </div>
        </div></div>
      )}

      {modal === "csv" && (
        <div className="overlay"><div className="modal" style={{ maxWidth: 800 }}>
          <div className="modal-title">CSV Preview - {csvRows.length} products</div>
          <div className="text-xs text-muted mb12">After import - go to each product to add suppliers and prices</div>
          <div className="tbl-wrap" style={{ maxHeight: 360, overflowY: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Category</th><th>Count Note</th>
                  <th>Order Unit</th><th>Count Unit</th><th>Conv.</th><th>Par</th>
                </tr>
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
