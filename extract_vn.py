import re
import sys

def extract_vietnamese_strings(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Matches strings that contain at least one Vietnamese character
    vn_chars = 'áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ'
    pattern = r"(['\"])([^'\"]*[" + vn_chars + r"][^'\"]*)\1"
    
    matches = re.finditer(pattern, content)
    for match in matches:
        print(f"{filepath}: {match.group(2)}")

for arg in sys.argv[1:]:
    extract_vietnamese_strings(arg)
