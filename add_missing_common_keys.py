import re

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'common.upload_photo': 'Tải ảnh lên',
    'common.change_photo': 'Đổi ảnh',
    """,
    'en': """
    'common.upload_photo': 'Upload Photo',
    'common.change_photo': 'Change Photo',
    """,
    'ko': """
    'common.upload_photo': '사진 업로드',
    'common.change_photo': '사진 변경',
    """,
    'ja': """
    'common.upload_photo': '写真をアップロード',
    'common.change_photo': '写真を変更',
    """,
    'zh': """
    'common.upload_photo': '上传照片',
    'common.change_photo': '更改照片',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

