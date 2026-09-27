import re

with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    '<label className="block font-bold text-slate-500 mb-1 text-[11px]">Địa chỉ</label>',
    '<label className="block font-bold text-slate-500 mb-1 text-[11px]">{t("customers.form.address", "Địa chỉ")}</label>'
)

c = c.replace(
    'placeholder="Địa chỉ"',
    'placeholder={t("customers.form.address_placeholder", "Địa chỉ")}'
)

with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
