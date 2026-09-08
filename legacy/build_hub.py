from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.styles import numbers as num_fmt

wb = Workbook()

# ─── BRAND COLOURS ────────────────────────────────────────────────────────────
DARK    = "1A0A00"   # near-black espresso
GOLD    = "C8952C"   # warm amber
CREAM   = "FDF6EC"   # off-white
WHITE   = "FFFFFF"
GREEN   = "1E7A34"
RED     = "B03020"
AMBER   = "D4840A"
LGRAY   = "F2EDE6"   # light gray-cream for alternating rows
MID     = "3D1F00"   # mid brown for sub-headers

def col(hex_str):
    return hex_str

def fill(hex_str):
    return PatternFill("solid", fgColor=hex_str)

def font(bold=False, size=11, color=DARK, italic=False):
    return Font(name="Arial", bold=bold, size=size, color=color, italic=italic)

def align(h="left", v="center", wrap=False):
    return Alignment(horizontal=h, vertical=v, wrap_text=wrap)

def border_all(thin=True):
    s = "thin" if thin else "medium"
    side = Side(style=s, color="D0C4B0")
    return Border(left=side, right=side, top=side, bottom=side)

def border_bottom(medium=False):
    s = "medium" if medium else "thin"
    side = Side(style=s, color="C8952C")
    return Border(bottom=side)

def set_cell(ws, row, col_idx, value, bold=False, size=11, fc=DARK, bg=None,
             h="left", v="center", wrap=False, italic=False, num_format=None, hyperlink=None):
    c = ws.cell(row=row, column=col_idx, value=value)
    c.font = Font(name="Arial", bold=bold, size=size, color=fc, italic=italic)
    if bg:
        c.fill = fill(bg)
    c.alignment = align(h, v, wrap)
    if num_format:
        c.number_format = num_format
    if hyperlink:
        c.hyperlink = hyperlink
        c.font = Font(name="Arial", bold=bold, size=size, color="0563C1", underline="single", italic=italic)
    return c

def merge(ws, r1, c1, r2, c2):
    ws.merge_cells(start_row=r1, start_column=c1, end_row=r2, end_column=c2)

def header_row(ws, row, text, bg=DARK, fc=WHITE, size=14, cols=(1,10)):
    merge(ws, row, cols[0], row, cols[1])
    c = ws.cell(row=row, column=cols[0], value=text)
    c.font = Font(name="Arial", bold=True, size=size, color=fc)
    c.fill = fill(bg)
    c.alignment = align("left", "center")
    ws.row_dimensions[row].height = 28

def sub_header(ws, row, text, cols=(1,10)):
    merge(ws, row, cols[0], row, cols[1])
    c = ws.cell(row=row, column=cols[0], value=text)
    c.font = Font(name="Arial", bold=True, size=10, color=WHITE)
    c.fill = fill(MID)
    c.alignment = align("left", "center")
    ws.row_dimensions[row].height = 20

def kpi_tile(ws, row, col_idx, label, value, bg=GOLD, label_fc=WHITE, val_fc=WHITE):
    merge(ws, row, col_idx, row, col_idx+1)
    c = ws.cell(row=row, column=col_idx, value=label)
    c.font = Font(name="Arial", bold=False, size=9, color=label_fc)
    c.fill = fill(bg)
    c.alignment = align("center", "center")

    merge(ws, row+1, col_idx, row+1, col_idx+1)
    v = ws.cell(row=row+1, column=col_idx, value=value)
    v.font = Font(name="Arial", bold=True, size=16, color=val_fc)
    v.fill = fill(bg)
    v.alignment = align("center", "center")
    ws.row_dimensions[row].height = 18
    ws.row_dimensions[row+1].height = 30

# ══════════════════════════════════════════════════════════════════════════════
# SHEET 1 — HUB
# ══════════════════════════════════════════════════════════════════════════════
hub = wb.active
hub.title = "🏠 HUB"
hub.sheet_view.showGridLines = False

# Set column widths
col_widths = [1, 18, 18, 18, 18, 18, 18, 18, 18, 18, 1]
for i, w in enumerate(col_widths, 1):
    hub.column_dimensions[get_column_letter(i)].width = w

# Row 1 — spacer
hub.row_dimensions[1].height = 6

# Row 2-3 — Title
merge(hub, 2, 2, 3, 10)
c = hub.cell(row=2, column=2, value="APOSTELLO COFFEE  ·  BUSINESS HUB")
c.font = Font(name="Arial", bold=True, size=20, color=WHITE)
c.fill = fill(DARK)
c.alignment = align("center", "center")
hub.row_dimensions[2].height = 22
hub.row_dimensions[3].height = 22

# Row 4 — subtitle
merge(hub, 4, 2, 4, 10)
c = hub.cell(row=4, column=2, value="One place for every number, every customer, every decision.")
c.font = Font(name="Arial", bold=False, size=10, color=GOLD, italic=True)
c.fill = fill(DARK)
c.alignment = align("center", "center")
hub.row_dimensions[4].height = 20

# Row 5 — spacer
merge(hub, 5, 2, 5, 10)
hub.cell(row=5, column=2).fill = fill(DARK)
hub.row_dimensions[5].height = 8

# Row 6 — TODAY label
merge(hub, 6, 2, 6, 10)
c = hub.cell(row=6, column=2, value='=TODAY()')
c.font = Font(name="Arial", bold=False, size=10, color=CREAM, italic=True)
c.fill = fill(MID)
c.alignment = align("right", "center")
c.number_format = 'DDDD, D MMMM YYYY'
hub.row_dimensions[6].height = 18

# Spacer
hub.row_dimensions[7].height = 10

# ── KPI TILES ──────────────────────────────────────────────────────────────
# Row 8 label
sub_header(hub, 8, "  TODAY AT A GLANCE  —  Fill in Daily Log sheet each evening, these tiles update automatically")

# Rows 9-10 — KPI tiles
kpi_tile(hub, 9, 2, "TODAY'S CUPS", "→ Daily Log", DARK, CREAM, GOLD)
kpi_tile(hub, 9, 4, "TODAY'S REVENUE", "→ Daily Log", MID, CREAM, GOLD)
kpi_tile(hub, 9, 6, "LOYALTY MEMBERS", "=COUNTA('👥 CRM'!B:B)-1", GREEN, WHITE, WHITE)
kpi_tile(hub, 9, 8, "STOCK ALERTS", "→ Stock Take", RED, WHITE, WHITE)

# Spacer
hub.row_dimensions[11].height = 12

# ── WEEKLY SNAPSHOT ────────────────────────────────────────────────────────
sub_header(hub, 12, "  THIS WEEK  (from your Costing Model — paste weekly revenue / profit here)")
hub.row_dimensions[12].height = 20

labels_w = ["WEEKLY REVENUE", "GROSS PROFIT", "NET PROFIT", "CUPS SOLD"]
vals_w   = ["=Weekly_Revenue", "=Weekly_GP", "=Weekly_Net", "=Weekly_Cups"]
note_w   = ["Link to Costing Model", "Link to Costing Model", "Link to Costing Model", "Link to Costing Model"]

for i, (lb, vl, nt) in enumerate(zip(labels_w, vals_w, note_w)):
    col_start = 2 + i*2
    merge(hub, 13, col_start, 13, col_start+1)
    lc = hub.cell(row=13, column=col_start, value=lb)
    lc.font = Font(name="Arial", bold=False, size=8, color=WHITE)
    lc.fill = fill(GOLD)
    lc.alignment = align("center", "center")
    hub.row_dimensions[13].height = 16

    merge(hub, 14, col_start, 14, col_start+1)
    vc = hub.cell(row=14, column=col_start, value=nt)
    vc.font = Font(name="Arial", bold=True, size=11, color=GOLD, italic=True)
    vc.fill = fill(DARK)
    vc.alignment = align("center", "center")
    hub.row_dimensions[14].height = 24

# Spacer
hub.row_dimensions[15].height = 12

# ── QUICK LINKS ────────────────────────────────────────────────────────────
sub_header(hub, 16, "  QUICK LINKS  —  Click to open")

links = [
    ("📧  MAILCHIMP", "https://mailchimp.com/login", "Weekly email campaigns"),
    ("📱  INSTAGRAM", "https://www.instagram.com", "Post & check engagement"),
    ("🔗  LOYALTY FORM", "https://docs.google.com/forms", "Paste your Google Form URL here"),
    ("💳  YOCO PORTAL", "https://portal.yoco.com", "Daily sales & payouts"),
    ("💬  WHATSAPP BIZ", "https://web.whatsapp.com", "Broadcast specials"),
    ("📍  GOOGLE BUSINESS", "https://business.google.com", "Reviews & map listing"),
    ("📊  CANVA", "https://www.canva.com", "Design posts & signage"),
    ("📨  EMAIL INBOX", "https://mail.google.com", "Customer replies"),
]

for i, (label, url, desc) in enumerate(links):
    r = 17 + (i // 4) * 3
    c_start = 2 + (i % 4) * 2

    merge(hub, r, c_start, r, c_start+1)
    lc = hub.cell(row=r, column=c_start, value=label)
    lc.font = Font(name="Arial", bold=True, size=10, color="0563C1", underline="single")
    lc.fill = fill(LGRAY)
    lc.alignment = align("center", "center")
    lc.hyperlink = url
    hub.row_dimensions[r].height = 22

    merge(hub, r+1, c_start, r+1, c_start+1)
    dc = hub.cell(row=r+1, column=c_start, value=desc)
    dc.font = Font(name="Arial", bold=False, size=8, color=MID, italic=True)
    dc.fill = fill(LGRAY)
    dc.alignment = align("center", "center")
    hub.row_dimensions[r+1].height = 16

    hub.row_dimensions[r+2].height = 6

# ── NAVIGATION ─────────────────────────────────────────────────────────────
nav_row = 26
sub_header(hub, nav_row, "  NAVIGATE  —  Click any sheet tab at the bottom, or use these labels")

sheets_nav = [
    ("👥 CRM & LOYALTY", "Track customers, stamps, visit history"),
    ("📦 STOCK TAKE", "Open & close counts, reorder alerts"),
    ("📋 DAILY LOG", "End-of-day entry — 5 minutes every close"),
    ("📊 WEEKLY P&L", "Revenue, costs, profit — auto from Daily Log"),
    ("📈 MONTHLY SUMMARY", "4-week roll-up, trends, growth"),
    ("💰 COSTING MODEL", "Recipes, ingredients, break-even (existing file)"),
    ("⚙ SETTINGS", "Business settings, targets, VAT"),
    ("📘 HOW TO USE", "Workflow guide"),
]

for i, (nm, desc) in enumerate(sheets_nav):
    r = nav_row + 1 + (i // 4) * 3
    c_start = 2 + (i % 4) * 2

    merge(hub, r, c_start, r, c_start+1)
    nc = hub.cell(row=r, column=c_start, value=nm)
    nc.font = Font(name="Arial", bold=True, size=9, color=WHITE)
    nc.fill = fill(MID)
    nc.alignment = align("center", "center")
    hub.row_dimensions[r].height = 22

    merge(hub, r+1, c_start, r+1, c_start+1)
    dc2 = hub.cell(row=r+1, column=c_start, value=desc)
    dc2.font = Font(name="Arial", bold=False, size=8, color=DARK, italic=True)
    dc2.fill = fill(CREAM)
    dc2.alignment = align("center", "center", wrap=True)
    hub.row_dimensions[r+1].height = 26
    hub.row_dimensions[r+2].height = 6

# Final spacer + footer
footer_row = 34
merge(hub, footer_row, 2, footer_row, 10)
fc = hub.cell(row=footer_row, column=2,
              value="Apostello Coffee · Built for growth · Update the Daily Log every close of day to keep this hub live.")
fc.font = Font(name="Arial", bold=False, size=9, color=CREAM, italic=True)
fc.fill = fill(DARK)
fc.alignment = align("center", "center")
hub.row_dimensions[footer_row].height = 20

# ══════════════════════════════════════════════════════════════════════════════
# SHEET 2 — CRM & LOYALTY
# ══════════════════════════════════════════════════════════════════════════════
crm = wb.create_sheet("👥 CRM")
crm.sheet_view.showGridLines = False

crm_cols = [1, 5, 20, 18, 15, 14, 13, 10, 10, 10, 12, 10, 10, 18, 1]
for i, w in enumerate(crm_cols, 1):
    crm.column_dimensions[get_column_letter(i)].width = w

crm.row_dimensions[1].height = 6

merge(crm, 2, 2, 3, 14)
c = crm.cell(row=2, column=2, value="APOSTELLO COFFEE  ·  CUSTOMER CRM & LOYALTY")
c.font = Font(name="Arial", bold=True, size=16, color=WHITE)
c.fill = fill(DARK)
c.alignment = align("left", "center")
crm.row_dimensions[2].height = 22
crm.row_dimensions[3].height = 22

merge(crm, 4, 2, 4, 14)
c = crm.cell(row=4, column=2, value="QR code → Google Form → paste new rows here. Update Visit Count & Last Visit each time a customer returns.")
c.font = Font(name="Arial", italic=True, size=9, color=MID)
c.fill = fill(CREAM)
c.alignment = align("left", "center")
crm.row_dimensions[4].height = 18

crm.row_dimensions[5].height = 8

# Summary tiles row 6–7
kpi_tile(crm, 6, 2, "TOTAL CUSTOMERS", '=COUNTA(B11:B2000)', DARK, CREAM, GOLD)
kpi_tile(crm, 6, 4, "ACTIVE (≤30 days)", '=COUNTIF(H11:H2000,">="&(TODAY()-30))', GREEN, WHITE, WHITE)
kpi_tile(crm, 6, 6, "INACTIVE (>30 days)", '=COUNTIF(H11:H2000,"<"&(TODAY()-30))', RED, WHITE, WHITE)
kpi_tile(crm, 6, 8, "FREE COFFEES EARNED", '=SUMIF(I11:I2000,">=10",I11:I2000)', GOLD, WHITE, WHITE)
kpi_tile(crm, 6, 10, "SMS OPT-IN", '=COUNTIF(K11:K2000,"Yes")', MID, WHITE, CREAM)
kpi_tile(crm, 6, 12, "EMAIL OPT-IN", '=COUNTIF(L11:L2000,"Yes")', MID, WHITE, CREAM)
crm.row_dimensions[8].height = 8

# Column headers row 9
crm.row_dimensions[9].height = 8

headers_crm = [
    "#", "First Name", "Cell Number", "Email Address",
    "Date Joined", "Last Visit", "Total Visits",
    "Loyalty Stamps", "Free Coffees", "Total Spent (R)",
    "SMS Opt-in", "Email Opt-in", "How Found Us", "Notes"
]

for i, h in enumerate(headers_crm, 2):
    c = crm.cell(row=10, column=i, value=h)
    c.font = Font(name="Arial", bold=True, size=9, color=WHITE)
    c.fill = fill(GOLD)
    c.alignment = align("center", "center")
    c.border = border_all()
crm.row_dimensions[10].height = 22

# 20 sample rows with formulas
for r in range(11, 31):
    bg = CREAM if r % 2 == 0 else WHITE
    row_num = r - 10

    # # (row number)
    c = crm.cell(row=r, column=2, value=row_num)
    c.font = Font(name="Arial", size=9, color=MID)
    c.fill = fill(bg)
    c.alignment = align("center")
    c.border = border_all()

    for col_i in range(3, 16):
        cell = crm.cell(row=r, column=col_i, value="")
        cell.fill = fill(bg)
        cell.font = Font(name="Arial", size=9, color=DARK)
        cell.border = border_all()
        cell.alignment = align("left", "center")

    # Date columns
    crm.cell(row=r, column=7).number_format = "DD/MM/YYYY"  # Date Joined
    crm.cell(row=r, column=8).number_format = "DD/MM/YYYY"  # Last Visit
    crm.cell(row=r, column=7).alignment = align("center")
    crm.cell(row=r, column=8).alignment = align("center")
    crm.cell(row=r, column=9).alignment = align("center")   # Total Visits
    crm.cell(row=r, column=10).alignment = align("center")  # Stamps
    crm.cell(row=r, column=11).alignment = align("center")  # Free coffees
    crm.cell(row=r, column=12).number_format = 'R#,##0.00'  # Total spent
    crm.cell(row=r, column=13).alignment = align("center")  # SMS
    crm.cell(row=r, column=14).alignment = align("center")  # Email

crm.row_dimensions[r].height = 18

# Instructions block at bottom
inst_row = 33
merge(crm, inst_row, 2, inst_row, 14)
ic = crm.cell(row=inst_row, column=2, value="HOW THE LOYALTY PROGRAMME WORKS")
ic.font = Font(name="Arial", bold=True, size=10, color=WHITE)
ic.fill = fill(MID)
ic.alignment = align("left", "center")
crm.row_dimensions[inst_row].height = 20

instructions = [
    "1.  Customer scans QR code at counter → completes Google Form (name, phone, email).",
    "2.  You paste their details into this sheet. Date Joined fills in automatically.",
    "3.  EVERY visit: update 'Last Visit' date and add +1 to 'Total Visits' and 'Loyalty Stamps'.",
    "4.  When Loyalty Stamps = 10 → award 1 free coffee. Reset stamps to 0 and add 1 to Free Coffees Earned.",
    "5.  Monthly: filter 'Last Visit' < 30 days ago → send WIN-BACK WhatsApp / email to inactive customers.",
    "6.  SMS Opt-in = Yes → add to WhatsApp Broadcast List. Email Opt-in = Yes → add to Mailchimp list.",
]
for j, line in enumerate(instructions):
    r2 = inst_row + 1 + j
    merge(crm, r2, 2, r2, 14)
    lc2 = crm.cell(row=r2, column=2, value=line)
    lc2.font = Font(name="Arial", size=9, color=DARK)
    lc2.fill = fill(LGRAY if j % 2 == 0 else CREAM)
    lc2.alignment = align("left", "center")
    crm.row_dimensions[r2].height = 18

# ══════════════════════════════════════════════════════════════════════════════
# SHEET 3 — STOCK TAKE
# ══════════════════════════════════════════════════════════════════════════════
stk = wb.create_sheet("📦 Stock Take")
stk.sheet_view.showGridLines = False

stk_widths = [1, 5, 28, 14, 12, 12, 12, 12, 14, 14, 1]
for i, w in enumerate(stk_widths, 1):
    stk.column_dimensions[get_column_letter(i)].width = w

stk.row_dimensions[1].height = 6

merge(stk, 2, 2, 3, 10)
c = stk.cell(row=2, column=2, value="APOSTELLO COFFEE  ·  DAILY STOCK TAKE")
c.font = Font(name="Arial", bold=True, size=16, color=WHITE)
c.fill = fill(DARK)
c.alignment = align("left", "center")
stk.row_dimensions[2].height = 22
stk.row_dimensions[3].height = 22

# Date row
stk.row_dimensions[4].height = 8
merge(stk, 5, 2, 5, 10)
dc = stk.cell(row=5, column=2, value='=TODAY()')
dc.font = Font(name="Arial", bold=True, size=11, color=GOLD)
dc.fill = fill(MID)
dc.alignment = align("right", "center")
dc.number_format = "DDDD D MMMM YYYY"
stk.row_dimensions[5].height = 20

stk.row_dimensions[6].height = 8

# Column headers
hdrs_stk = ["#", "Item", "Category", "Opening\nCount", "Units\nSold", "Waste /\nSpoilage",
            "Closing\nCount", "Reorder\nLevel", "Status", "Notes"]
for i, h in enumerate(hdrs_stk, 2):
    c = stk.cell(row=7, column=i, value=h)
    c.font = Font(name="Arial", bold=True, size=9, color=WHITE)
    c.fill = fill(GOLD)
    c.alignment = align("center", "center", wrap=True)
    c.border = border_all()
stk.row_dimensions[7].height = 30

stock_items = [
    (1,  "Specialty coffee beans (g)",   "Coffee",    500, 0, 0, 100, ""),
    (2,  "Full cream milk (L)",           "Dairy",      8,  0, 0, 2,   ""),
    (3,  "Low fat milk (L)",              "Dairy",      4,  0, 0, 1,   ""),
    (4,  "Oat milk (L)",                  "Dairy alt",  2,  0, 0, 1,   ""),
    (5,  "Almond milk (L)",               "Dairy alt",  1,  0, 0, 1,   ""),
    (6,  "Chocolate powder (g)",          "Dry goods", 200, 0, 0, 50,  ""),
    (7,  "Vanilla syrup (ml)",            "Syrups",    300, 0, 0, 100, ""),
    (8,  "Caramel syrup (ml)",            "Syrups",    300, 0, 0, 100, ""),
    (9,  "Croissants",                    "Bakery",     12, 0, 0, 4,   ""),
    (10, "Banana bread slices",           "Bakery",     10, 0, 0, 3,   ""),
    (11, "Muffins",                       "Bakery",      8, 0, 0, 2,   ""),
    (12, "Takeaway cups small (8oz)",     "Packaging", 100, 0, 0, 20,  ""),
    (13, "Takeaway cups medium (12oz)",   "Packaging", 100, 0, 0, 20,  ""),
    (14, "Takeaway cups large (16oz)",    "Packaging", 100, 0, 0, 20,  ""),
    (15, "Cup lids",                      "Packaging", 200, 0, 0, 40,  ""),
    (16, "Burger boxes",                  "Packaging",  50, 0, 0, 10,  ""),
    (17, "Sandwich wrap paper",           "Packaging", 100, 0, 0, 20,  ""),
    (18, "Wooden stirrers",               "Packaging", 200, 0, 0, 50,  ""),
    (19, "Paper napkins",                 "Packaging", 300, 0, 0, 50,  ""),
    (20, "Gas (LPG) — full cylinders",    "Energy",      2, 0, 0, 1,   "Check weight"),
]

for idx, (num, item, cat, opening, sold, waste, reorder, note) in enumerate(stock_items):
    r = 8 + idx
    bg = CREAM if idx % 2 == 0 else WHITE

    # #
    c = stk.cell(row=r, column=2, value=num)
    c.font = Font(name="Arial", size=9, color=MID)
    c.fill = fill(bg); c.alignment = align("center"); c.border = border_all()

    # Item
    c = stk.cell(row=r, column=3, value=item)
    c.font = Font(name="Arial", bold=True, size=9, color=DARK)
    c.fill = fill(bg); c.alignment = align("left"); c.border = border_all()

    # Category
    c = stk.cell(row=r, column=4, value=cat)
    c.font = Font(name="Arial", size=9, color=MID)
    c.fill = fill(bg); c.alignment = align("center"); c.border = border_all()

    # Opening (manual input — blue)
    c = stk.cell(row=r, column=5, value=opening)
    c.font = Font(name="Arial", size=9, color="0000FF")
    c.fill = fill(bg); c.alignment = align("center"); c.border = border_all()

    # Units sold (manual — blue)
    c = stk.cell(row=r, column=6, value=sold)
    c.font = Font(name="Arial", size=9, color="0000FF")
    c.fill = fill(bg); c.alignment = align("center"); c.border = border_all()

    # Waste (manual — blue)
    c = stk.cell(row=r, column=7, value=waste)
    c.font = Font(name="Arial", size=9, color="0000FF")
    c.fill = fill(bg); c.alignment = align("center"); c.border = border_all()

    # Closing = Opening - Sold - Waste (formula — black)
    open_col = get_column_letter(5)
    sold_col = get_column_letter(6)
    waste_col = get_column_letter(7)
    c = stk.cell(row=r, column=8, value=f"={open_col}{r}-{sold_col}{r}-{waste_col}{r}")
    c.font = Font(name="Arial", size=9, color=DARK)
    c.fill = fill(bg); c.alignment = align("center"); c.border = border_all()

    # Reorder level
    c = stk.cell(row=r, column=9, value=reorder)
    c.font = Font(name="Arial", size=9, color=MID)
    c.fill = fill(bg); c.alignment = align("center"); c.border = border_all()

    # Status = IF closing <= reorder → REORDER else OK
    c = stk.cell(row=r, column=10,
                 value=f'=IF(H{r}<=I{r},"🔴 REORDER","✅ OK")')
    c.font = Font(name="Arial", bold=True, size=9, color=DARK)
    c.fill = fill(bg); c.alignment = align("center"); c.border = border_all()

    # Notes
    c = stk.cell(row=r, column=11, value=note)
    c.font = Font(name="Arial", size=9, color=MID, italic=True)
    c.fill = fill(bg); c.alignment = align("left"); c.border = border_all()

    stk.row_dimensions[r].height = 18

# Alerts summary
alert_row = 8 + len(stock_items) + 2
merge(stk, alert_row, 2, alert_row, 10)
ac = stk.cell(row=alert_row, column=2,
              value='=IFERROR("Items needing reorder: "&COUNTIF(J8:J27,"🔴 REORDER")&" — check highlighted rows above","")  ')
ac.font = Font(name="Arial", bold=True, size=11, color=WHITE)
ac.fill = fill(RED)
ac.alignment = align("center", "center")
stk.row_dimensions[alert_row].height = 24

merge(stk, alert_row+1, 2, alert_row+1, 10)
nc2 = stk.cell(row=alert_row+1, column=2,
               value="BLUE = enter manually every morning (opening) and evening (closing).  BLACK = calculated automatically.")
nc2.font = Font(name="Arial", size=9, color=MID, italic=True)
nc2.fill = fill(LGRAY)
nc2.alignment = align("center", "center")
stk.row_dimensions[alert_row+1].height = 18

# ══════════════════════════════════════════════════════════════════════════════
# SHEET 4 — DAILY LOG
# ══════════════════════════════════════════════════════════════════════════════
dl = wb.create_sheet("📋 Daily Log")
dl.sheet_view.showGridLines = False

dl_widths = [1, 5, 30, 16, 16, 16, 16, 16, 16, 16, 1]
for i, w in enumerate(dl_widths, 1):
    dl.column_dimensions[get_column_letter(i)].width = w

dl.row_dimensions[1].height = 6
merge(dl, 2, 2, 3, 10)
c = dl.cell(row=2, column=2, value="APOSTELLO COFFEE  ·  DAILY OPERATIONS LOG")
c.font = Font(name="Arial", bold=True, size=16, color=WHITE)
c.fill = fill(DARK)
c.alignment = align("left", "center")
dl.row_dimensions[2].height = 22
dl.row_dimensions[3].height = 22

merge(dl, 4, 2, 4, 10)
c = dl.cell(row=4, column=2, value="Fill in each evening at close. 5 minutes per day. Feeds the Weekly P&L automatically.")
c.font = Font(name="Arial", italic=True, size=9, color=MID)
c.fill = fill(CREAM)
c.alignment = align("left", "center")
dl.row_dimensions[4].height = 18
dl.row_dimensions[5].height = 8

# Column headers
hdrs_dl = ["#", "Date", "Day", "Cups\nSold", "Revenue\n(Yoco R)", "New\nCustomers",
           "Loyalty\nSign-ups", "Weather", "Notes / Issues", "Tomorrow\nPrep"]
for i, h in enumerate(hdrs_dl, 2):
    c = dl.cell(row=6, column=i, value=h)
    c.font = Font(name="Arial", bold=True, size=9, color=WHITE)
    c.fill = fill(GOLD)
    c.alignment = align("center", "center", wrap=True)
    c.border = border_all()
dl.row_dimensions[6].height = 30

for idx in range(60):  # 60 rows = ~3 months
    r = 7 + idx
    bg = CREAM if idx % 2 == 0 else WHITE

    c = dl.cell(row=r, column=2, value=idx+1)
    c.font = Font(name="Arial", size=9, color=MID)
    c.fill = fill(bg); c.alignment = align("center"); c.border = border_all()

    # Date
    c = dl.cell(row=r, column=3, value="")
    c.font = Font(name="Arial", size=9, color="0000FF")
    c.fill = fill(bg); c.alignment = align("center"); c.border = border_all()
    c.number_format = "DD/MM/YYYY"

    # Day formula
    c = dl.cell(row=r, column=4, value=f'=IF(C{r}="","",TEXT(C{r},"DDDD"))')
    c.font = Font(name="Arial", size=9, color=DARK)
    c.fill = fill(bg); c.alignment = align("center"); c.border = border_all()

    for col_i in [5, 6, 7]:  # cups, revenue, new customers, signups
        cell = dl.cell(row=r, column=col_i, value="")
        cell.font = Font(name="Arial", size=9, color="0000FF")
        cell.fill = fill(bg); cell.alignment = align("center"); cell.border = border_all()
        if col_i == 6:
            cell.number_format = 'R#,##0.00'

    for col_i in [8, 9, 10, 11]:  # loyalty signups, weather, notes, tomorrow prep
        cell = dl.cell(row=r, column=col_i, value="")
        cell.font = Font(name="Arial", size=9, color=DARK if col_i > 8 else "0000FF")
        cell.fill = fill(bg); cell.alignment = align("left", "center", wrap=True); cell.border = border_all()

    dl.row_dimensions[r].height = 18

# Totals row
totals_row = 7 + 60
merge(dl, totals_row, 2, totals_row, 4)
tc = dl.cell(row=totals_row, column=2, value="TOTALS (all entries)")
tc.font = Font(name="Arial", bold=True, size=10, color=WHITE)
tc.fill = fill(DARK); tc.alignment = align("left", "center")
dl.row_dimensions[totals_row].height = 22

for col_i, col_letter in [(5, "E"), (6, "F"), (7, "G"), (8, "H")]:
    c = dl.cell(row=totals_row, column=col_i,
                value=f"=SUM({col_letter}7:{col_letter}{totals_row-1})")
    c.font = Font(name="Arial", bold=True, size=10, color=GOLD)
    c.fill = fill(DARK); c.alignment = align("center"); c.border = border_all()
    if col_i == 6:
        c.number_format = 'R#,##0.00'

# ══════════════════════════════════════════════════════════════════════════════
# SHEET 5 — WEEKLY P&L
# ══════════════════════════════════════════════════════════════════════════════
pnl = wb.create_sheet("📊 Weekly P&L")
pnl.sheet_view.showGridLines = False

pnl_widths = [1, 5, 32, 16, 16, 16, 16, 16, 16, 16, 1]
for i, w in enumerate(pnl_widths, 1):
    pnl.column_dimensions[get_column_letter(i)].width = w

pnl.row_dimensions[1].height = 6
merge(pnl, 2, 2, 3, 10)
c = pnl.cell(row=2, column=2, value="APOSTELLO COFFEE  ·  WEEKLY PROFIT & LOSS")
c.font = Font(name="Arial", bold=True, size=16, color=WHITE)
c.fill = fill(DARK)
c.alignment = align("left", "center")
pnl.row_dimensions[2].height = 22
pnl.row_dimensions[3].height = 22

merge(pnl, 4, 2, 4, 10)
c = pnl.cell(row=4, column=2,
             value="Enter week start dates in row 7. Enter revenue from Yoco + food costs from Costing Model. Everything else calculates.")
c.font = Font(name="Arial", italic=True, size=9, color=MID)
c.fill = fill(CREAM); c.alignment = align("left", "center")
pnl.row_dimensions[4].height = 18
pnl.row_dimensions[5].height = 8

# Column headers — up to 8 weeks
week_headers = ["Metric", "Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7", "Wk 8"]
for i, h in enumerate(week_headers, 2):
    c = pnl.cell(row=6, column=i, value=h)
    c.font = Font(name="Arial", bold=True, size=9, color=WHITE)
    c.fill = fill(GOLD if i > 2 else DARK)
    c.alignment = align("center", "center")
    c.border = border_all()
pnl.row_dimensions[6].height = 22

# Week start date row
pnl.cell(row=7, column=2, value="Week start date").font = Font(name="Arial", bold=True, size=9, color=DARK)
pnl.cell(row=7, column=2).fill = fill(LGRAY)
pnl.cell(row=7, column=2).border = border_all()
for col_i in range(3, 11):
    c = pnl.cell(row=7, column=col_i, value="")
    c.font = Font(name="Arial", size=9, color="0000FF")
    c.fill = fill(LGRAY); c.alignment = align("center"); c.border = border_all()
    c.number_format = "DD/MM/YYYY"
pnl.row_dimensions[7].height = 20

# P&L line items
pnl_lines = [
    # (label, bg, bold, is_formula, formula_template, num_fmt)
    ("REVENUE", DARK, True, False, None, None),
    ("Total Revenue (Yoco)", WHITE, False, False, None, 'R#,##0.00'),
    ("VAT collected (15%)", LGRAY, False, True, "={col}{rev_row}*0.15", 'R#,##0.00'),
    ("Revenue ex VAT", CREAM, True, True, "={col}{rev_row}-{col}{vat_row}", 'R#,##0.00'),
    ("", LGRAY, False, False, None, None),
    ("COST OF SALES", DARK, True, False, None, None),
    ("Food & beverage cost", WHITE, False, False, None, 'R#,##0.00'),
    ("Packaging cost", WHITE, False, False, None, 'R#,##0.00'),
    ("Total Cost of Sales", LGRAY, True, True, "={col}{fc_row}+{col}{pk_row}", 'R#,##0.00'),
    ("", LGRAY, False, False, None, None),
    ("GROSS PROFIT", GOLD, True, True, "={col}{rev_exvat_row}-{col}{cogs_row}", 'R#,##0.00'),
    ("Gross Margin %", CREAM, False, True, '=IFERROR({col}{gp_row}/{col}{rev_exvat_row},"-")', '0.0%'),
    ("", LGRAY, False, False, None, None),
    ("FIXED COSTS", DARK, True, False, None, None),
    ("Salaries (total)", WHITE, False, False, None, 'R#,##0.00'),
    ("Loan repayment", WHITE, False, False, None, 'R#,##0.00'),
    ("Insurance", WHITE, False, False, None, 'R#,##0.00'),
    ("Marketing spend", WHITE, False, False, None, 'R#,##0.00'),
    ("Admin / accounting", WHITE, False, False, None, 'R#,##0.00'),
    ("Other fixed costs", WHITE, False, False, None, 'R#,##0.00'),
    ("Total Fixed Costs", LGRAY, True, True, "=SUM({col}{fix_start}:{col}{fix_end})", 'R#,##0.00'),
    ("", LGRAY, False, False, None, None),
    ("VARIABLE COSTS", DARK, True, False, None, None),
    ("Card fees (2.9%)", WHITE, False, True, "={col}{rev_row}*0.029", 'R#,##0.00'),
    ("Gas / LPG", WHITE, False, False, None, 'R#,##0.00'),
    ("Other variable", WHITE, False, False, None, 'R#,##0.00'),
    ("Total Variable Costs", LGRAY, True, True, "={col}{vc_card_row}+{col}{vc_gas_row}+{col}{vc_other_row}", 'R#,##0.00'),
    ("", LGRAY, False, False, None, None),
    ("NET PROFIT / (LOSS)", GREEN, True, True, "={col}{gp_row}-{col}{tfc_row}-{col}{tvc_row}", 'R#,##0.00'),
    ("Net Margin %", CREAM, False, True, '=IFERROR({col}{np_row}/{col}{rev_exvat_row},"-")', '0.0%'),
    ("", LGRAY, False, False, None, None),
    ("UNITS SOLD", MID, True, False, None, None),
    ("Total cups", WHITE, False, False, None, '#,##0'),
    ("Avg cups per day", CREAM, False, True, "=IFERROR({col}{cups_row}/5,\"-\")", '0.0'),
    ("Revenue per cup (R)", CREAM, False, True, "=IFERROR({col}{rev_row}/{col}{cups_row},\"-\")", 'R#,##0.00'),
]

row_map = {}
current_row = 8
for label, bg, bold, is_calc, formula_tmpl, nf in pnl_lines:
    row_map[label] = current_row

    c = pnl.cell(row=current_row, column=2, value=label)
    c.font = Font(name="Arial", bold=bold, size=9, color=WHITE if bg in [DARK, GOLD, GREEN, MID] else DARK)
    c.fill = fill(bg)
    c.alignment = align("left", "center")
    c.border = border_all()
    pnl.row_dimensions[current_row].height = 20

    for wi, col_i in enumerate(range(3, 11)):
        col_letter = get_column_letter(col_i)
        cell = pnl.cell(row=current_row, column=col_i)
        cell.fill = fill(bg)
        cell.alignment = align("center")
        cell.border = border_all()

        if is_calc and formula_tmpl:
            rev_row = row_map.get("Total Revenue (Yoco)", current_row)
            vat_row = row_map.get("VAT collected (15%)", current_row)
            rev_exvat_row = row_map.get("Revenue ex VAT", current_row)
            fc_row = row_map.get("Food & beverage cost", current_row)
            pk_row = row_map.get("Packaging cost", current_row)
            cogs_row = row_map.get("Total Cost of Sales", current_row)
            gp_row = row_map.get("GROSS PROFIT", current_row)
            fix_start = row_map.get("Salaries (total)", current_row)
            fix_end = row_map.get("Other fixed costs", current_row)
            tfc_row = row_map.get("Total Fixed Costs", current_row)
            vc_card_row = row_map.get("Card fees (2.9%)", current_row)
            vc_gas_row = row_map.get("Gas / LPG", current_row)
            vc_other_row = row_map.get("Other variable", current_row)
            tvc_row = row_map.get("Total Variable Costs", current_row)
            np_row = row_map.get("NET PROFIT / (LOSS)", current_row)
            cups_row = row_map.get("Total cups", current_row)

            try:
                formula = formula_tmpl.format(
                    col=col_letter,
                    rev_row=rev_row, vat_row=vat_row, rev_exvat_row=rev_exvat_row,
                    fc_row=fc_row, pk_row=pk_row, cogs_row=cogs_row,
                    gp_row=gp_row, fix_start=fix_start, fix_end=fix_end, tfc_row=tfc_row,
                    vc_card_row=vc_card_row, vc_gas_row=vc_gas_row, vc_other_row=vc_other_row,
                    tvc_row=tvc_row, np_row=np_row, cups_row=cups_row
                )
                cell.value = formula
                cell.font = Font(name="Arial", size=9,
                                 color=WHITE if bg in [DARK, GOLD, GREEN, MID] else DARK)
            except Exception:
                cell.value = ""
        elif not is_calc and label not in ["", "REVENUE", "COST OF SALES", "FIXED COSTS",
                                            "VARIABLE COSTS", "UNITS SOLD"]:
            cell.font = Font(name="Arial", size=9, color="0000FF")
        else:
            cell.font = Font(name="Arial", bold=bold, size=9,
                             color=WHITE if bg in [DARK, GOLD, GREEN, MID] else DARK)

        if nf:
            cell.number_format = nf

    current_row += 1

# ══════════════════════════════════════════════════════════════════════════════
# SHEET 6 — MONTHLY SUMMARY
# ══════════════════════════════════════════════════════════════════════════════
mth = wb.create_sheet("📈 Monthly Summary")
mth.sheet_view.showGridLines = False

mth_widths = [1, 5, 30, 16, 16, 16, 16, 16, 16, 16, 1]
for i, w in enumerate(mth_widths, 1):
    mth.column_dimensions[get_column_letter(i)].width = w

mth.row_dimensions[1].height = 6
merge(mth, 2, 2, 3, 10)
c = mth.cell(row=2, column=2, value="APOSTELLO COFFEE  ·  MONTHLY INCOME SUMMARY")
c.font = Font(name="Arial", bold=True, size=16, color=WHITE)
c.fill = fill(DARK)
c.alignment = align("left", "center")
mth.row_dimensions[2].height = 22
mth.row_dimensions[3].height = 22

merge(mth, 4, 2, 4, 10)
c = mth.cell(row=4, column=2,
             value="Enter month actuals from Yoco + Weekly P&L totals. Tracks growth month on month. Share with owners for monthly review.")
c.font = Font(name="Arial", italic=True, size=9, color=MID)
c.fill = fill(CREAM); c.alignment = align("left", "center")
mth.row_dimensions[4].height = 18
mth.row_dimensions[5].height = 8

month_cols = ["Metric", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "TOTAL"]
for i, h in enumerate(month_cols, 2):
    c = mth.cell(row=6, column=i, value=h)
    c.font = Font(name="Arial", bold=True, size=9, color=WHITE)
    c.fill = fill(GOLD if i > 2 else DARK)
    c.alignment = align("center", "center")
    c.border = border_all()
    mth.column_dimensions[get_column_letter(i)].width = 12 if i > 2 else 28
mth.row_dimensions[6].height = 22

monthly_lines = [
    ("INCOME", DARK, True),
    ("Total Revenue (R)", WHITE, False),
    ("Cups sold", WHITE, False),
    ("Avg revenue / day (R)", LGRAY, True),
    ("", LGRAY, False),
    ("COSTS", DARK, True),
    ("Total food cost (R)", WHITE, False),
    ("Total fixed costs (R)", WHITE, False),
    ("Total variable costs (R)", WHITE, False),
    ("Total costs (R)", LGRAY, True),
    ("", LGRAY, False),
    ("PROFIT", GREEN, True),
    ("Gross Profit (R)", WHITE, False),
    ("Net Profit (R)", WHITE, False),
    ("Net Margin %", CREAM, False),
    ("", LGRAY, False),
    ("CUSTOMERS", MID, True),
    ("New loyalty sign-ups", WHITE, False),
    ("Total loyalty members", WHITE, False),
    ("Mailchimp list size", WHITE, False),
    ("", LGRAY, False),
    ("NOTES", DARK, True),
    ("Key wins this month", WHITE, False),
    ("Key challenges", WHITE, False),
    ("Action for next month", WHITE, False),
]

for idx, (label, bg, bold) in enumerate(monthly_lines):
    r = 7 + idx
    c = mth.cell(row=r, column=2, value=label)
    fc_color = WHITE if bg in [DARK, GREEN, MID] else DARK
    c.font = Font(name="Arial", bold=bold, size=9, color=fc_color)
    c.fill = fill(bg); c.alignment = align("left", "center"); c.border = border_all()
    mth.row_dimensions[r].height = 20

    is_pct = "%" in label
    is_text_row = label in ["Key wins this month", "Key challenges", "Action for next month", ""]
    is_header = bg in [DARK, GREEN, MID] and label != ""
    is_calc_total = label in ["Avg revenue / day (R)", "Total costs (R)", "Net Margin %"]

    for wi, col_i in enumerate(range(3, 16)):
        col_letter = get_column_letter(col_i)
        cell = mth.cell(row=r, column=col_i)
        cell.fill = fill(bg)
        cell.alignment = align("center", "center", wrap=True if is_text_row else False)
        cell.border = border_all()
        cell.font = Font(name="Arial", size=9, color=fc_color if is_header else (DARK if is_text_row or is_calc_total else "0000FF"))

        if col_i == 15:  # TOTAL column
            if not is_header and not is_text_row and label != "":
                data_range = f"{get_column_letter(3)}{r}:{get_column_letter(14)}{r}"
                if is_pct:
                    cell.value = f"=IFERROR(AVERAGE({data_range}),\"-\")"
                elif not is_calc_total:
                    cell.value = f"=SUM({data_range})"
                cell.font = Font(name="Arial", bold=True, size=9, color=GOLD)
                if is_pct:
                    cell.number_format = "0.0%"
                elif not is_text_row:
                    cell.number_format = 'R#,##0' if "R)" in label else '#,##0'

        if is_pct and not is_header:
            cell.number_format = "0.0%"
        elif not is_text_row and not is_header and "R)" in label:
            cell.number_format = 'R#,##0'

# ══════════════════════════════════════════════════════════════════════════════
# SHEET 7 — SETTINGS
# ══════════════════════════════════════════════════════════════════════════════
sett = wb.create_sheet("⚙ Settings")
sett.sheet_view.showGridLines = False
sett.column_dimensions["A"].width = 1
sett.column_dimensions["B"].width = 5
sett.column_dimensions["C"].width = 35
sett.column_dimensions["D"].width = 20
sett.column_dimensions["E"].width = 12
sett.column_dimensions["F"].width = 35

sett.row_dimensions[1].height = 6
merge(sett, 2, 2, 3, 6)
c = sett.cell(row=2, column=2, value="APOSTELLO COFFEE  ·  BUSINESS SETTINGS")
c.font = Font(name="Arial", bold=True, size=16, color=WHITE)
c.fill = fill(DARK); c.alignment = align("left", "center")
sett.row_dimensions[2].height = 22; sett.row_dimensions[3].height = 22

settings_data = [
    ("BUSINESS DETAILS", None, None, None),
    ("Business name", "Apostello Coffee", "text", "Trading name on all documents"),
    ("Location / address", "CMV Business Park", "text", "Where the trailer is based"),
    ("Trading hours", "06:30 – 15:30", "text", "Mon–Fri"),
    ("Operating days / week", 5, "number", "Mon–Fri"),
    ("Weeks operated / month", 4.33, "number", "Standard month"),
    ("Weeks operated / year", 50, "number", "Allow 2 weeks closure"),
    ("", None, None, None),
    ("FINANCIAL", None, None, None),
    ("VAT rate", 0.15, "percent", "South African standard 15%"),
    ("Yoco card fee %", 0.029, "percent", "Commission per transaction"),
    ("Wastage / spoilage %", 0.05, "percent", "5% on food cost"),
    ("Target gross margin", 0.65, "percent", "Industry: 60–70% for coffee"),
    ("Opening cash balance (R)", 25000, "currency", "Cash on hand at start"),
    ("Owner's drawings / month (R)", 8000, "currency", "Personal income from business"),
    ("Monthly revenue growth %", 0.03, "percent", "Conservative 3% per month"),
    ("", None, None, None),
    ("MARKETING", None, None, None),
    ("Instagram handle", "@apostellocoffee", "text", "Update if different"),
    ("Google Business name", "Apostello Coffee", "text", "Exact name on Google Maps"),
    ("Mailchimp audience name", "Apostello Loyalty List", "text", "Your Mailchimp audience"),
    ("WhatsApp Business number", "+27 XX XXX XXXX", "text", "Your business WhatsApp"),
    ("Loyalty free coffee after", 10, "number", "Stamps before free coffee"),
    ("", None, None, None),
    ("TARGETS", None, None, None),
    ("Daily cup target", 100, "number", "20 → 100 cup journey"),
    ("Weekly revenue target (R)", 58968, "currency", "Based on current costing model"),
    ("Monthly net profit target (R)", 75916, "currency", "From costing model projections"),
    ("New loyalty signups / week", 10, "number", "Target sign-ups per week"),
]

row = 5
for item in settings_data:
    label, value, dtype, note = item
    if label == "":
        sett.row_dimensions[row].height = 8
        row += 1
        continue

    is_header = value is None
    bg = MID if is_header else (CREAM if row % 2 == 0 else WHITE)

    if is_header:
        merge(sett, row, 2, row, 6)
    c = sett.cell(row=row, column=2 if is_header else 3, value=label)
    c.font = Font(name="Arial", bold=is_header, size=9 if not is_header else 10,
                  color=WHITE if is_header else DARK)
    c.fill = fill(bg if not is_header else MID)
    c.alignment = align("left", "center")
    c.border = border_all()

    if not is_header:
        vc = sett.cell(row=row, column=4, value=value)
        vc.font = Font(name="Arial", size=10, color="0000FF", bold=True)
        vc.fill = fill(bg)
        vc.alignment = align("center")
        vc.border = border_all()
        if dtype == "percent":
            vc.number_format = "0.0%"
        elif dtype == "currency":
            vc.number_format = "R#,##0.00"

        ec = sett.cell(row=row, column=5, value=dtype.upper() if dtype else "")
        ec.font = Font(name="Arial", size=8, color=MID, italic=True)
        ec.fill = fill(bg); ec.alignment = align("center"); ec.border = border_all()

        nc = sett.cell(row=row, column=6, value=note)
        nc.font = Font(name="Arial", size=9, color=MID, italic=True)
        nc.fill = fill(bg); nc.alignment = align("left", "center"); nc.border = border_all()

    sett.row_dimensions[row].height = 20
    row += 1

# ══════════════════════════════════════════════════════════════════════════════
# SHEET 8 — HOW TO USE
# ══════════════════════════════════════════════════════════════════════════════
how = wb.create_sheet("📘 How To Use")
how.sheet_view.showGridLines = False
how.column_dimensions["A"].width = 1
how.column_dimensions["B"].width = 5
how.column_dimensions["C"].width = 40
how.column_dimensions["D"].width = 60

how.row_dimensions[1].height = 6
merge(how, 2, 2, 3, 4)
c = how.cell(row=2, column=2, value="APOSTELLO COFFEE  ·  HOW TO USE THIS HUB")
c.font = Font(name="Arial", bold=True, size=16, color=WHITE)
c.fill = fill(DARK); c.alignment = align("left", "center")
how.row_dimensions[2].height = 22; how.row_dimensions[3].height = 22
how.row_dimensions[4].height = 8

instructions_full = [
    ("DAILY ROUTINE (5 minutes at close)", DARK, True, ""),
    ("1. Stock Take sheet", WHITE, False, "Morning: enter opening counts (blue cells). Evening: enter units sold + waste. Reorder alerts auto-appear."),
    ("2. Daily Log sheet", WHITE, False, "Enter: date, cups sold (from Yoco), total revenue, new customers, new loyalty signups, weather, notes."),
    ("3. CRM sheet", WHITE, False, "For each new loyalty sign-up: paste name, phone, email. Fill in Date Joined. Done."),
    ("", LGRAY, False, ""),
    ("WEEKLY ROUTINE (30 minutes Monday morning)", MID, True, ""),
    ("4. Weekly P&L sheet", WHITE, False, "Enter this week's totals: revenue, food cost, fixed costs. Net profit calculates automatically."),
    ("5. CRM — inactive check", WHITE, False, "Filter Last Visit < 7 days ago → send WhatsApp broadcast special to bring them back."),
    ("6. Mailchimp email", WHITE, False, "Send one email to your list: this week's special + a photo. Sunday evening works best."),
    ("7. Instagram — 3 posts", WHITE, False, "Monday behind-the-scenes. Wednesday product shot. Friday special + CTA. Use Canva templates."),
    ("", LGRAY, False, ""),
    ("MONTHLY ROUTINE (1 hour, first Monday)", GOLD, True, ""),
    ("8. Monthly Summary sheet", WHITE, False, "Enter month actuals. Review growth vs target. Share link with owners for review meeting."),
    ("9. Update Mailchimp list", WHITE, False, "Export new emails from CRM sheet. Import into Mailchimp. Update segment tags."),
    ("10. Review stock patterns", WHITE, False, "Check which items were reordered most. Adjust opening counts and reorder levels."),
    ("11. Review low-margin items", WHITE, False, "Open the Costing Model. Look at Low-Margin Alert table. Decide if prices need adjusting."),
    ("", LGRAY, False, ""),
    ("COLOUR CODE GUIDE", DARK, True, ""),
    ("Blue text", WHITE, False, "→ You enter this. Manual inputs only."),
    ("Black text", WHITE, False, "→ Calculated automatically. Do not type over."),
    ("Green text", WHITE, False, "→ Pulled from another sheet within this workbook."),
    ("GOLD headers", WHITE, False, "→ Section headers or KPI tiles."),
    ("🔴 REORDER alert", WHITE, False, "→ Closing stock is at or below reorder level. Order before tomorrow."),
    ("", LGRAY, False, ""),
    ("LOYALTY PROGRAMME LOGIC", MID, True, ""),
    ("QR code setup", WHITE, False, "Create a Google Form: Name, Phone, Email, How did you find us? Generate QR. Print A5. Place on counter."),
    ("Stamp tracking", WHITE, False, "Every visit: +1 to Loyalty Stamps column. When = 10, mark free coffee earned, reset to 0."),
    ("Win-back campaign", WHITE, False, "Monthly: find customers with Last Visit > 30 days. Send WhatsApp: 'We miss you — here's 20% off your next cup.'"),
    ("", LGRAY, False, ""),
    ("CONNECTING TO YOUR COSTING MODEL", DARK, True, ""),
    ("Separate file", WHITE, False, "Keep Apostello_Costing_Model.xlsx as your recipe/pricing source. Update ingredients when supplier prices change."),
    ("Weekly transfer", WHITE, False, "Each Monday, copy Weekly Revenue + Net Profit from Costing Model Dashboard into this hub's Weekly P&L."),
    ("Google Sheets tip", WHITE, False, "Upload both files to Google Drive. Share both with owners. Link sheets between files using IMPORTRANGE()."),
]

row = 5
for label, bg, bold, desc in instructions_full:
    if label == "":
        how.row_dimensions[row].height = 8
        row += 1
        continue
    is_header = bold and bg in [DARK, MID, GOLD]
    fc_c = WHITE if is_header else DARK

    if is_header:
        merge(how, row, 2, row, 4)
        c = how.cell(row=row, column=2, value=label)
        c.font = Font(name="Arial", bold=True, size=10, color=WHITE)
        c.fill = fill(bg); c.alignment = align("left", "center"); c.border = border_all()
        how.row_dimensions[row].height = 22
    else:
        lc = how.cell(row=row, column=3, value=label)
        lc.font = Font(name="Arial", bold=True, size=9, color=DARK)
        lc.fill = fill(CREAM if row % 2 == 0 else WHITE)
        lc.alignment = align("left", "center"); lc.border = border_all()

        dc = how.cell(row=row, column=4, value=desc)
        dc.font = Font(name="Arial", size=9, color=DARK)
        dc.fill = fill(CREAM if row % 2 == 0 else WHITE)
        dc.alignment = align("left", "center", wrap=True)
        dc.border = border_all()
        how.row_dimensions[row].height = 30

    row += 1

# ══════════════════════════════════════════════════════════════════════════════
# SAVE
# ══════════════════════════════════════════════════════════════════════════════
output_path = "/Users/luhandredebeer/Downloads/Apostello_Business_Hub.xlsx"
wb.save(output_path)
print(f"Saved: {output_path}")
