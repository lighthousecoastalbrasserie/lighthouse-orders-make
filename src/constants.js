export const CATS = ["Produce","Dairy","Meat","Seafood","Dry Goods","Bakery","Frozen","Beverages","Cleaning","Other"];

export const CAT_CLR = {
  Produce: "#2e7d32",
  Dairy: "#1565c0",
  Meat: "#c62828",
  Seafood: "#00838f",
  "Dry Goods": "#f5a700",
  Bakery: "#e65100",
  Frozen: "#6a1b9a",
  Beverages: "#00695c",
  Cleaning: "#4527a0",
  Other: "#546e7a",
};

export const SUP_CLR = [
  "#0097a7",
  "#e65100",
  "#2e7d32",
  "#6a1b9a",
  "#c62828",
  "#1565c0",
  "#f5a700",
  "#00695c",
  "#4527a0",
  "#37474f",
];

export const uid = () => Math.random().toString(36).slice(2,9);
export const f$ = n => "$" + Number(n || 0).toFixed(2);
export const today = () => new Date().toISOString().slice(0, 10);
export const cClr = c => CAT_CLR[c] || "#546e7a";
export const sClr = (sups, sid) => {
  const i = sups.findIndex(s => s.id === sid);
  return SUP_CLR[i >= 0 ? i % SUP_CLR.length : 0];
};

export const ROLES = {
  GM: "gm",
  STAFF: "staff",
};

export const PAGES = {
  COUNT: "count",
  ORDER: "order",
  MANAGE: "manage",
};
