import re

with open('/Volumes/Coding/GloPro/src/components/customers/CustomerTiersTab.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace button texts
c = c.replace(
    "{runningCheck ? 'Đang xét hạng...' : 'Chạy xét duy trì hạng'}",
    "{runningCheck ? t('customers.tiers.running_review', 'Đang xét hạng...') : t('customers.tiers.run_review', 'Chạy xét duy trì hạng')}"
)

# Replace 'hoặc'
c = c.replace(
    "</span> hoặc <span",
    "</span> {t('customers.tiers.or', 'hoặc')} <span"
)

# Replace 'hóa đơn'
c = c.replace(
    "} hóa đơn • {",
    "} {t('customers.tiers.invoice_word', 'hóa đơn')} • {"
)

# Move PERIOD_LABELS inside the component to use t()
c = c.replace(
    """const PERIOD_LABELS = {
  year: 'Hằng năm',
  '6_months': 'Hằng 6 tháng',
  quarter: 'Hằng quý',
  upgrade_duration: 'Số ngày sau nâng hạng'
};""",
    """const getPeriodLabels = (t) => ({
  year: t('customers.tiers.period_year', 'Hằng năm'),
  '6_months': t('customers.tiers.period_6m', 'Hằng 6 tháng'),
  quarter: t('customers.tiers.period_quarter', 'Hằng quý'),
  upgrade_duration: t('customers.tiers.period_upgrade', 'Số ngày sau nâng hạng')
});"""
)

# Update the usage of PERIOD_LABELS
c = c.replace(
    "PERIOD_LABELS[tier.maintenance_period]",
    "getPeriodLabels(t)[tier.maintenance_period]"
)

# Translate 'ngày'
c = c.replace(
    "`${tier.maintenance_days} ngày`",
    "`${tier.maintenance_days} ${t('customers.tiers.days', 'ngày')}`"
)

with open('/Volumes/Coding/GloPro/src/components/customers/CustomerTiersTab.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

