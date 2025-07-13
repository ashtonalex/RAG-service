import os
from typing import Optional

def convert_to_pdf(input_path: str, output_path: Optional[str] = None) -> str:
    ext = input_path.lower().split('.')[-1]
    if not output_path:
        output_path = os.path.splitext(input_path)[0] + ".pdf"
    if ext == 'pdf':
        return input_path  # Already PDF
    elif ext == 'docx':
        try:
            from docx2pdf import convert
        except ImportError:
            raise ImportError("Please install docx2pdf: pip install docx2pdf")
        convert(input_path, output_path)
    elif ext in ['jpg', 'jpeg', 'png']:
        try:
            from PIL import Image
        except ImportError:
            raise ImportError("Please install Pillow: pip install pillow")
        image = Image.open(input_path)
        image.convert('RGB').save(output_path, 'PDF')
    elif ext == 'txt':
        try:
            from fpdf import FPDF
        except ImportError:
            raise ImportError("Please install fpdf: pip install fpdf")
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font('Arial', size=12)
        with open(input_path, 'r', encoding='utf-8') as f:
            for line in f:
                pdf.cell(200, 10, txt=line.strip(), ln=True)
        pdf.output(output_path)
    else:
        raise ValueError(f'Unsupported file type: {ext}')
    return output_path 