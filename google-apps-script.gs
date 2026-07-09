/**
 * Vault backend — two-way sync with the app.
 * Tabs (auto-created): Transactions | Fixed Commitments | Everyday Budgets | Plan
 * Setup: Sheet → Extensions → Apps Script → paste this → Save →
 *   Deploy → New deployment → Web app → Execute as "Me",
 *   Who has access "Anyone" → Deploy → copy the /exec URL into the app.
 * You can edit any row in these tabs by hand; the app pulls your edits on next sync.
 */
function tab(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); if (headers) sh.appendRow(headers); }
  else if (headers && sh.getLastRow() === 0) { sh.appendRow(headers); }
  return sh;
}
function readRows(sh) {
  var lr = sh.getLastRow(); if (lr < 2) return [];
  var lc = sh.getLastColumn();
  var vals = sh.getRange(1, 1, lr, lc).getValues();
  var hdr = vals[0], out = [];
  for (var i = 1; i < vals.length; i++) {
    var o = {}; for (var j = 0; j < hdr.length; j++) o[hdr[j]] = vals[i][j];
    out.push(o);
  }
  return out;
}
function getData() {
  var t = tab("Transactions", ["Date", "Type", "Category", "Amount", "Note", "ID", "Timestamp"]);
  var f = tab("Fixed Commitments", ["Name", "Monthly Amount"]);
  var b = tab("Everyday Budgets", ["Category", "Monthly Amount", "Key"]);
  var p = tab("Plan", ["Setting", "Value"]);
  var plan = {}; readRows(p).forEach(function (r) { plan[r.Setting] = r.Value; });
  return { transactions: readRows(t), fixed: readRows(f), budgets: readRows(b), plan: plan };
}
function doGet(e) {
  var json = JSON.stringify(getData());
  if (e && e.parameter && e.parameter.callback) {
    return ContentService.createTextOutput(e.parameter.callback + "(" + json + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  if (body.upserts && body.upserts.length) {
    var t = tab("Transactions", ["Date", "Type", "Category", "Amount", "Note", "ID", "Timestamp"]);
    var rows = readRows(t), idx = {};
    for (var i = 0; i < rows.length; i++) idx[String(rows[i].ID)] = i + 2;
    body.upserts.forEach(function (x) {
      var row = [x.date, x.type, x.cat, x.amt, x.note || "", x.id, x.ts];
      if (idx[String(x.id)]) t.getRange(idx[String(x.id)], 1, 1, 7).setValues([row]);
      else t.appendRow(row);
    });
  }
  if (body.deletes && body.deletes.length) {
    var t2 = tab("Transactions"), rows2 = readRows(t2), del = [];
    for (var k = 0; k < rows2.length; k++)
      if (body.deletes.indexOf(String(rows2[k].ID)) >= 0) del.push(k + 2);
    del.sort(function (a, b) { return b - a; }).forEach(function (r) { t2.deleteRow(r); });
  }
  if (body.plan) {
    var p = body.plan;
    var pSh = tab("Plan", ["Setting", "Value"]); pSh.clear(); pSh.appendRow(["Setting", "Value"]);
    ["income", "savings", "goal", "vault", "bonus"].forEach(function (kk) {
      if (p[kk] !== undefined) pSh.appendRow([kk, p[kk]]);
    });
    if (p.fixed) {
      var fSh = tab("Fixed Commitments"); fSh.clear(); fSh.appendRow(["Name", "Monthly Amount"]);
      p.fixed.forEach(function (x) { fSh.appendRow([x.name, x.amt]); });
    }
    if (p.budgets) {
      var bSh = tab("Everyday Budgets"); bSh.clear(); bSh.appendRow(["Category", "Monthly Amount", "Key"]);
      p.budgets.forEach(function (x) { bSh.appendRow([x.label, x.budget, x.key]); });
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
