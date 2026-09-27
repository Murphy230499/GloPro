import re

with open('/Volumes/Coding/GloPro/src/views/InvoiceDetail.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 209
content = content.replace("confirm('{t('invoices.action.delete', 'Huỷ hoá đơn')} này? Hành động không thể hoàn tác.')", "confirm(`${t('invoices.action.delete', 'Huỷ hoá đơn')} này? Hành động không thể hoàn tác.`)")

# 212
content = content.replace("'{t('invoices.action.delete', 'Huỷ hoá đơn')} khỏi hệ thống'", "`${t('invoices.action.delete', 'Huỷ hoá đơn')} khỏi hệ thống`")

# 247
content = content.replace("confirm('{t('invoices.action.cancel_payment', 'Huỷ thanh toán')} cho hoá đơn này và chuyển lại về trạng thái Chưa thanh toán?')", "confirm(`${t('invoices.action.cancel_payment', 'Huỷ thanh toán')} cho hoá đơn này và chuyển lại về trạng thái Chưa thanh toán?`)")

# 264
content = content.replace("'{t('invoice_detail.pay', 'Thanh toán')} hoá đơn'", "`${t('invoice_detail.pay', 'Thanh toán')} hoá đơn`")

# 272
content = content.replace("'{t('invoice_detail.pay', 'Thanh toán')} thành công'", "`${t('invoice_detail.pay', 'Thanh toán')} thành công`")

# 319
content = content.replace("'{t('invoices.action.print', 'In hoá đơn')} thanh toán'", "`${t('invoices.action.print', 'In hoá đơn')} thanh toán`")

with open('/Volumes/Coding/GloPro/src/views/InvoiceDetail.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
