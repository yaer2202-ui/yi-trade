/* Google Sheets stock feed. Set csvUrl to a published CSV/Web App URL.
   Use the exact header text from row 1 for skuColumn and quantityColumn. */
window.SHOP_STOCK_CONFIG = {
  csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQKpEP2qiyF__iFh47OrToVyLNV5oEFdHLh3H73Y8p7s7j1Kd7D6-VnJDFmHmT0UelUa5z59YAfrMRm/pub?gid=2022504441&single=true&output=csv',
  skuColumn: 'SKU',
  quantityColumn: 'מלאי זמין',
  refreshMs: 120000
};
