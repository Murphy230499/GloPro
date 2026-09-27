import re

with open('/Volumes/Coding/GloPro/src/views/InvoiceDetail.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix occurrences of '{t(..., ...)}' inside JS strings
# e.g. '{t('invoices.action.delete', 'Huỷ hoá đơn')}' -> ${t('invoices.action.delete', 'Huỷ hoá đơn')}
# Wait, if it's inside single quotes like '{t('...', '...')}', it's breaking JS.
# Let's just fix the exact strings my script broke.

replacements = [
    ("'{t('invoices.action.delete', 'Huỷ hoá đơn')}'", "t('invoices.action.delete', 'Huỷ hoá đơn')"),
    ("'{t('invoices.status.paid', 'Đã thanh toán')}'", "t('invoices.status.paid', 'Đã thanh toán')"),
    ("'{t('invoices.action.cancel_payment', 'Huỷ thanh toán')}'", "t('invoices.action.cancel_payment', 'Huỷ thanh toán')"),
    ("'{t('invoice_detail.pay', 'Thanh toán')}'", "t('invoice_detail.pay', 'Thanh toán')"),
    ("'{t('invoices.action.print', 'In hoá đơn')}'", "t('invoices.action.print', 'In hoá đơn')"),
    ("'{t('invoice_detail.assign_staff', 'Xếp nhân viên')}'", "t('invoice_detail.assign_staff', 'Xếp nhân viên')"),
]

for old, new in replacements:
    content = content.replace(old, new)
    
# Now, there are some template strings that were messed up:
# `{t('invoice_detail.pay', 'Thanh toán')} số tiền ${formatVND(invoice.total || total)} qua ${methodLabels || 'Tiền mặt'}`
# Here the outer is backticks, so `{t...}` will just be literally "{t...}". It should be `${t...}`.
content = content.replace("`{t('invoice_detail.pay', 'Thanh toán')} số tiền", "`${t('invoice_detail.pay', 'Thanh toán')} số tiền")
content = content.replace("`{t('invoices.action.print', 'In hoá đơn')} lần thứ", "`${t('invoices.action.print', 'In hoá đơn')} lần thứ")

# Also fix `if (!confirm(t('invoices.action.delete', 'Huỷ hoá đơn') này? Hành động không thể hoàn tác.')) return;`
# Wait, the replacement made it: `if (!confirm(t('invoices.action.delete', 'Huỷ hoá đơn') này? Hành động không thể hoàn tác.'))` which is still invalid if it doesn't have + or template literal.
# Let's check what it looks like now:
# "if (!confirm(t('invoices.action.delete', 'Huỷ hoá đơn') này? Hành động không thể hoàn tác.')) return;"
# That's missing quotes around " này...".
# Let's use regex to fix confirm statements.
content = re.sub(
    r"confirm\(t\('([^']+)', '([^']+)'\) này\?", 
    r"confirm(t('\1', '\2') + ' này?", 
    content
)

# Fix: `if (!confirm(t('invoices.action.cancel_payment', 'Huỷ thanh toán') cho hoá đơn này...`
content = re.sub(
    r"confirm\(t\('([^']+)', '([^']+)'\) cho hoá đơn", 
    r"confirm(t('\1', '\2') + ' cho hoá đơn", 
    content
)

# Fix addLogEntry: addLogEntry(t('invoice_detail.pay', 'Thanh toán') hoá đơn
content = re.sub(
    r"addLogEntry\(t\('([^']+)', '([^']+)'\) hoá đơn",
    r"addLogEntry(t('\1', '\2') + ' hoá đơn",
    content
)

with open('/Volumes/Coding/GloPro/src/views/InvoiceDetail.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

