import re

with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if "import { useT }" not in content:
    content = content.replace(
        "import React, { useState, useEffect } from 'react';",
        "import React, { useState, useEffect } from 'react';\nimport { useT } from '@/lib/i18n';"
    )

# Add useT hooks in the main components
if "const { t } = useT();" not in content:
    content = content.replace(
        "export default function Customers() {",
        "export default function Customers() {\n  const { t } = useT();"
    )
    content = content.replace(
        "function CustomerDetail({ customer, customerGroups = [], customerTiers = [], invoices = [], memberships = [], onClose, onEdit, onDelete, onInvoiceCreated }) {",
        "function CustomerDetail({ customer, customerGroups = [], customerTiers = [], invoices = [], memberships = [], onClose, onEdit, onDelete, onInvoiceCreated }) {\n  const { t } = useT();"
    )
    content = content.replace(
        "function CustomerForm({ customer, groups = [], onClose, onSave }) {",
        "function CustomerForm({ customer, groups = [], onClose, onSave }) {\n  const { t } = useT();"
    )

with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
