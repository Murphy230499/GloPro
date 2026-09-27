import re

# 1. Update i18n.jsx
with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

translations_to_add = {
    'VI': "'invoices.pay_success': 'Đã thanh toán thành công hóa đơn ',",
    'EN': "'invoices.pay_success': 'Successfully paid invoice ',",
    'KO': "'invoices.pay_success': '청구서 결제 완료 ',",
    'JA': "'invoices.pay_success': '請求書の支払いが完了しました ',",
    'ZH': "'invoices.pay_success': '成功支付发票 ',"
}

for lang in ['VI', 'EN', 'KO', 'JA', 'ZH']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n    {translations_to_add[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

# 2. Update Invoices.jsx
with open('/Volumes/Coding/GloPro/src/views/Invoices.jsx', 'r', encoding='utf-8') as f:
    inv_content = f.read()

inv_content = inv_content.replace(
    ">\n                            Đã thanh toán\n                          </span>", 
    ">\n                            {t('invoices.status.paid', 'Đã thanh toán')}\n                          </span>"
)
inv_content = inv_content.replace(
    ">\n                            Chưa thanh toán\n                          </span>", 
    ">\n                            {t('invoices.status.unpaid', 'Chưa thanh toán')}\n                          </span>"
)
inv_content = inv_content.replace(
    ">\n                            Đã huỷ\n                          </span>", 
    ">\n                            {t('invoices.status.cancelled', 'Đã huỷ')}\n                          </span>"
)

# Toast translation
inv_content = inv_content.replace(
    "`Đã thanh toán thành công hóa đơn ${checkoutInvoice.invoice_code}`",
    "t('invoices.pay_success', 'Đã thanh toán thành công hóa đơn ') + checkoutInvoice.invoice_code"
)

with open('/Volumes/Coding/GloPro/src/views/Invoices.jsx', 'w', encoding='utf-8') as f:
    f.write(inv_content)
