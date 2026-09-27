import sys

with open('src/components/POSInvoiceModal.jsx', 'r') as f:
    content = f.read()

content = content.replace('const modalContent = (\n    <div \n      className="fixed inset-0', '  const modalContent = (\n    <div \n      className="fixed inset-0')

if 'return typeof document' not in content:
    content = content.replace('    </div>\n  );\n}', '    </div>\n  );\n\n  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;\n}')

with open('src/components/POSInvoiceModal.jsx', 'w') as f:
    f.write(content)

