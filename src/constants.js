export const CATS = ["PRODUCE","DAIRY","MEAT","POULTRY","SEAFOOD","DRY GOODS","FROZEN","NA BEVERAGES","PAPER AND DISPOSABLES","JANITORIAL","OTHER"];

export const LOCATIONS = ["FREEZER","COOLER","DRY SHELF","SPICES SHELF","FOH STATION","NA BEVERAGES","DISHWASHER"];

export const CAT_CLR = {
  PRODUCE: "#2e7d32",
  DAIRY: "#1565c0",
  MEAT: "#c62828",
  POULTRY: "#e65100",
  SEAFOOD: "#00838f",
  "DRY GOODS": "#f5a700",
  FROZEN: "#6a1b9a",
  "NA BEVERAGES": "#00695c",
  "PAPER AND DISPOSABLES": "#4527a0",
  JANITORIAL: "#37474f",
  OTHER: "#546e7a",
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

export const ROLES = { GM: "gm", STAFF: "staff" };
export const PAGES = { COUNT: "count", ORDER: "order", MANAGE: "manage" };
