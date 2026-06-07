from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
import os
import asyncio
import uuid
import asyncpg
from urllib.parse import urlparse
from dotenv import load_dotenv

def add_skills(doc):
    doc.add_heading('Skills', level=1)
    doc.add_paragraph('{% for skill in skills %}{{ skill }}{% if not loop.last %}, {% endif %}{% endfor %}')

def add_experience(doc):
    doc.add_heading('Experience', level=1)
    doc.add_paragraph('{% for exp in experience %}')
    
    p = doc.add_paragraph('{{ exp.title }} at {{ exp.company }}')
    p.runs[0].bold = True
    
    doc.add_paragraph('{{ exp.duration }}')
    doc.add_paragraph('{{ exp.description }}')
    doc.add_paragraph('{% endfor %}')

def add_education(doc):
    doc.add_heading('Education', level=1)
    doc.add_paragraph('{% for edu in education %}')
    
    p = doc.add_paragraph('{{ edu.degree }} - {{ edu.institution }}')
    p.runs[0].bold = True
    
    doc.add_paragraph('{{ edu.year }}')
    doc.add_paragraph('{% endfor %}')

def create_fresher_modern():
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    # ── helpers ──────────────────────────────────────────────────────────────

    def remove_cell_borders(cell):
        tc = cell._tc
        tcPr = tc.get_or_add_tcPr()
        tcBorders = OxmlElement('w:tcBorders')
        for side in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
            el = OxmlElement(f'w:{side}')
            el.set(qn('w:val'), 'none')
            tcBorders.append(el)
        tcPr.append(tcBorders)

    def set_cell_width(cell, twips):
        tcPr = cell._tc.get_or_add_tcPr()
        tcW = OxmlElement('w:tcW')
        tcW.set(qn('w:w'), str(twips))
        tcW.set(qn('w:type'), 'dxa')
        tcPr.append(tcW)

    def set_cell_margin(cell, top=0, bottom=0, left=0, right=0):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for side, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            el = OxmlElement(f'w:{side}')
            el.set(qn('w:w'), str(val))
            el.set(qn('w:type'), 'dxa')
            tcMar.append(el)
        tcPr.append(tcMar)

    def set_cell_valign(cell, align='top'):
        tcPr = cell._tc.get_or_add_tcPr()
        vAlign = OxmlElement('w:vAlign')
        vAlign.set(qn('w:val'), align)
        tcPr.append(vAlign)

    def remove_table_borders(table):
        tblPr = table._tbl.find(qn('w:tblPr'))
        if tblPr is None:
            tblPr = OxmlElement('w:tblPr')
            table._tbl.insert(0, tblPr)
        tblBorders = OxmlElement('w:tblBorders')
        for side in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
            el = OxmlElement(f'w:{side}')
            el.set(qn('w:val'), 'none')
            tblBorders.append(el)
        tblPr.append(tblBorders)

    def set_spacing(para, before=0, after=0):
        pPr = para._p.get_or_add_pPr()
        sp = OxmlElement('w:spacing')
        sp.set(qn('w:before'), str(before))
        sp.set(qn('w:after'), str(after))
        pPr.append(sp)

    def add_section_heading(cell_doc, text):
        """Mimics \section{} — allcaps bold text with bottom border rule."""
        para = cell_doc.add_paragraph()
        set_spacing(para, before=200, after=80)
        run = para.add_run(text.upper())
        run.bold = True
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(0, 0, 0)
        # bottom border rule
        pPr = para._p.get_or_add_pPr()
        pBdr = OxmlElement('w:pBdr')
        bottom = OxmlElement('w:bottom')
        bottom.set(qn('w:val'), 'single')
        bottom.set(qn('w:sz'), '6')
        bottom.set(qn('w:space'), '4')
        bottom.set(qn('w:color'), '888888')
        pBdr.append(bottom)
        pPr.append(pBdr)
        return para

    def add_entry(cell_doc, title, subtitle, location, date):
        """Mimics \entry{title}{subtitle}{location}{date} with right-tab."""
        # Line 1: bold title (left) + location (right)
        p1 = cell_doc.add_paragraph()
        set_spacing(p1, before=100, after=0)
        r1 = p1.add_run(title)
        r1.bold = True
        r1.font.size = Pt(10)
        # tab stop at right edge of left column (~3.8 inches = 5472 twips)
        pPr = p1._p.get_or_add_pPr()
        tabs = OxmlElement('w:tabs')
        tab = OxmlElement('w:tab')
        tab.set(qn('w:val'), 'right')
        tab.set(qn('w:pos'), '5400')
        tabs.append(tab)
        pPr.append(tabs)
        p1.add_run('\t' + location).font.size = Pt(10)

        # Line 2: italic subtitle (left) + date (right)
        p2 = cell_doc.add_paragraph()
        set_spacing(p2, before=0, after=60)
        r2 = p2.add_run(subtitle)
        r2.italic = True
        r2.font.size = Pt(10)
        pPr2 = p2._p.get_or_add_pPr()
        tabs2 = OxmlElement('w:tabs')
        tab2 = OxmlElement('w:tab')
        tab2.set(qn('w:val'), 'right')
        tab2.set(qn('w:pos'), '5400')
        tabs2.append(tab2)
        pPr2.append(tabs2)
        p2.add_run('\t' + date).font.size = Pt(10)

    def add_bullet(cell_doc, text):
        para = cell_doc.add_paragraph(style='List Bullet')
        set_spacing(para, before=0, after=30)
        run = para.add_run(text)
        run.font.size = Pt(9.5)

    def add_skill_rows(cell_doc, rows):
        """
        rows = [{'label': 'Code', 'items': ['Python · C++', 'TensorFlow · Git']}]
        Mimics \tableentry using a borderless mini-table.
        """
        # flatten into (label, value) pairs
        flat = []
        for row in rows:
            for i, item in enumerate(row['items']):
                flat.append((row['label'] if i == 0 else '', item))
            flat.append(('', ''))  # spacer row

        tbl = cell_doc.add_table(rows=len(flat), cols=2)
        remove_table_borders(tbl)
        for i, (label, value) in enumerate(flat):
            row_cells = tbl.rows[i].cells
            # label cell
            set_cell_width(row_cells[0], 900)
            remove_cell_borders(row_cells[0])
            lp = row_cells[0].paragraphs[0]
            lr = lp.add_run(label.upper())
            lr.bold = True
            lr.font.size = Pt(8)
            lr.font.color.rgb = RGBColor(80, 80, 80)
            set_spacing(lp, before=0, after=0)
            # value cell
            set_cell_width(row_cells[1], 2200)
            remove_cell_borders(row_cells[1])
            vp = row_cells[1].paragraphs[0]
            vp.add_run(value).font.size = Pt(9)
            set_spacing(vp, before=0, after=0)

    # ── Document ──────────────────────────────────────────────────────────────

    doc = Document()

    # Tighten default margins (A4: 11906 twips wide)
    for section in doc.sections:
        section.top_margin    = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin   = Inches(1.05)
        section.right_margin  = Inches(1.05)

    # Two-column layout via single-row borderless table
    # Content width ≈ 8882 twips → left 63% = 5595, right 37% = 3287
    LEFT_W  = 5595
    RIGHT_W = 3287

    layout = doc.add_table(rows=1, cols=2)
    remove_table_borders(layout)

    left_cell  = layout.cell(0, 0)
    right_cell = layout.cell(0, 1)

    set_cell_width(left_cell,  LEFT_W)
    set_cell_width(right_cell, RIGHT_W)
    set_cell_valign(left_cell,  'top')
    set_cell_valign(right_cell, 'top')
    set_cell_margin(left_cell,  top=0, bottom=0, left=0,   right=360)
    set_cell_margin(right_cell, top=0, bottom=0, left=200, right=0)

    remove_cell_borders(left_cell)
    remove_cell_borders(right_cell)

    # ── LEFT COLUMN ───────────────────────────────────────────────────────────

    # Name
    name_p = left_cell.paragraphs[0]
    name_r = name_p.add_run('{{ full_name }}')
    name_r.bold = True
    name_r.font.size = Pt(23)
    set_spacing(name_p, before=0, after=40)

    # Headline
    hl_p = left_cell.add_paragraph()
    hl_r = hl_p.add_run('{{ headline }}')
    hl_r.italic = True
    hl_r.font.size = Pt(11)
    hl_r.font.color.rgb = RGBColor(70, 70, 70)
    set_spacing(hl_p, before=0, after=240)

    # EDUCATION
    add_section_heading(left_cell, 'Education')

    add_entry(left_cell,
        '{{ edu[0].institution }}',
        '{{ edu[0].degree }}, {{ edu[0].major }}',
        '{{ edu[0].location }}',
        '{{ edu[0].year_start }} – {{ edu[0].year_end }}'
    )
    add_bullet(left_cell, '{{ edu[0].bullet_1 }}')
    add_bullet(left_cell, '{{ edu[0].bullet_2 }}')
    add_bullet(left_cell, '{{ edu[0].bullet_3 }}')
    left_cell.add_paragraph()  # spacer

    add_entry(left_cell,
        '{{ edu[1].institution }}',
        '{{ edu[1].degree }}, {{ edu[1].major }}',
        '{{ edu[1].location }}',
        '{{ edu[1].year_start }} – {{ edu[1].year_end }}'
    )

    # PROJECTS
    add_section_heading(left_cell, 'Projects')

    for i in range(3):
        add_entry(left_cell,
            f'{{{{ projects[{i}].title }}}}',
            f'{{{{ projects[{i}].tech }}}}',
            f'{{{{ projects[{i}].type }}}}',
            f'{{{{ projects[{i}].year }}}}'
        )
        add_bullet(left_cell, f'{{{{ projects[{i}].bullet_1 }}}}')
        add_bullet(left_cell, f'{{{{ projects[{i}].bullet_2 }}}}')
        left_cell.add_paragraph()  # spacer

    # ── RIGHT COLUMN ──────────────────────────────────────────────────────────

    # Contact block
    contact_p = right_cell.paragraphs[0]
    set_spacing(contact_p, before=0, after=0)

    for icon, placeholder in [
        ('✆', '{{ phone_number }}'),
        ('✉', '{{ email }}'),
        ('in', '{{ linkedin_url }}'),
    ]:
        cp = right_cell.add_paragraph() if icon != '✆' else contact_p
        icon_r = cp.add_run(f'{icon}  ')
        icon_r.font.size = Pt(9)
        icon_r.font.color.rgb = RGBColor(90, 90, 90)
        val_r = cp.add_run(placeholder)
        val_r.font.size = Pt(9)
        set_spacing(cp, before=0, after=60)

    right_cell.add_paragraph()  # spacer before skills

    # SKILLS
    add_section_heading(right_cell, 'Skills')
    add_skill_rows(right_cell, [
        {'label': 'Code', 'items': ['{{ skills.code_line_1 }}', '{{ skills.code_line_2 }}']},
        {'label': 'Lang', 'items': ['{{ skills.lang_1 }}', '{{ skills.lang_2 }}', '{{ skills.lang_3 }}', '{{ skills.lang_4 }}']},
    ])

    right_cell.add_paragraph()  # spacer

    # INTERESTS
    add_section_heading(right_cell, 'Interests')
    add_skill_rows(right_cell, [
        {'label': '{{ interests[0].domain }}', 'items': ['{{ interests[0].item_1 }}', '{{ interests[0].item_2 }}']},
        {'label': '{{ interests[1].domain }}', 'items': ['{{ interests[1].item_1 }}', '{{ interests[1].item_2 }}']},
    ])

    right_cell.add_paragraph()  # spacer

    # AWARDS
    add_section_heading(right_cell, 'Awards')
    add_skill_rows(right_cell, [
        {'label': '{{ awards[0].year }}', 'items': ['{{ awards[0].title }}', '{{ awards[0].contest }}']},
        {'label': '{{ awards[1].year }}', 'items': ['{{ awards[1].title }}', '{{ awards[1].contest }}']},
    ])

    # ── Save ──────────────────────────────────────────────────────────────────

    os.makedirs('seeds/templates', exist_ok=True)
    filepath = 'seeds/templates/Fresher_Modern.docx'
    doc.save(filepath)
    return filepath, "Fresher Modern", "Clean, modern two-column layout for freshers"
    
def create_fresher_classic():
    doc = Document()
    name = doc.add_paragraph('{{ full_name }}')
    name.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = name.runs[0]
    run.bold = True
    run.font.size = Pt(22)

    contact = doc.add_paragraph('{{ phone_number }} | {{ linkedin_url }} | {{ portfolio_url }}')
    contact.alignment = WD_ALIGN_PARAGRAPH.LEFT
    contact.paragraph_format.space_after = Pt(15)

    doc.add_heading('Objective', level=1)
    doc.add_paragraph('{{ summary }}')

    add_education(doc)
    add_skills(doc)
    add_experience(doc)

    os.makedirs('seeds/templates', exist_ok=True)
    filepath = 'seeds/templates/Fresher_Classic.docx'
    doc.save(filepath)
    return filepath, "Fresher Classic", "Traditional black-and-white academic layout"

def create_experienced_professional():
    doc = Document()
    name = doc.add_paragraph('{{ full_name }}')
    name.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = name.runs[0]
    run.bold = True
    run.font.size = Pt(26)
    
    role = doc.add_paragraph('{{ target_role }}')
    role.alignment = WD_ALIGN_PARAGRAPH.CENTER
    role.runs[0].italic = True

    contact = doc.add_paragraph('{{ phone_number }} | {{ linkedin_url }} | {{ portfolio_url }}')
    contact.alignment = WD_ALIGN_PARAGRAPH.CENTER
    contact.paragraph_format.space_after = Pt(20)

    doc.add_heading('Professional Summary', level=1)
    doc.add_paragraph('{{ summary }}')

    add_experience(doc)
    add_skills(doc)
    add_education(doc)

    os.makedirs('seeds/templates', exist_ok=True)
    filepath = 'seeds/templates/Experienced_Professional.docx'
    doc.save(filepath)
    return filepath, "Experienced Professional", "Focus on experience and achievements"

def create_experienced_executive():
    doc = Document()
    name = doc.add_paragraph('{{ full_name }}')
    name.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = name.runs[0]
    run.bold = True
    run.font.size = Pt(28)
    
    role = doc.add_paragraph('{{ target_role }}')
    role.alignment = WD_ALIGN_PARAGRAPH.LEFT
    role.runs[0].font.size = Pt(16)
    role.runs[0].italic = True

    contact = doc.add_paragraph('Phone: {{ phone_number }} | LinkedIn: {{ linkedin_url }}')
    contact.alignment = WD_ALIGN_PARAGRAPH.LEFT

    doc.add_heading('Executive Profile', level=1)
    doc.add_paragraph('{{ summary }}')

    add_skills(doc)
    add_experience(doc)
    add_education(doc)

    os.makedirs('seeds/templates', exist_ok=True)
    filepath = 'seeds/templates/Experienced_Executive.docx'
    doc.save(filepath)
    return filepath, "Experienced Executive", "Bold and spacious layout for senior roles"

async def seed_database(templates_data):
    import jwt
    import datetime
    import httpx
    
    # 1. Create a dummy JWT token for a system user or admin
    secret = "change-me-in-production"
    payload = {
        "userId": "system-seeder-001",
        "email": "admin@resumeforge.com",
        "role": "admin",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    token = jwt.encode(payload, secret, algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}
    
    # The profile service is exposed on port 8003 locally via docker
    profile_api_url = "http://localhost:8003/api/templates/"
    
    print(f"Uploading to {profile_api_url} ...")
    
    async with httpx.AsyncClient() as client:
        for filepath, name, desc in templates_data:
            abs_path = os.path.abspath(filepath)
            
            with open(abs_path, "rb") as f:
                files = {"file": (os.path.basename(abs_path), f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
                data = {
                    "name": name,
                    "description": desc,
                    "is_default": "true" if "Modern" in name else "false"
                }
                
                try:
                    response = await client.post(profile_api_url, headers=headers, data=data, files=files)
                    if response.status_code in (200, 201):
                        print(f"[OK] Successfully seeded: {name}")
                    else:
                        print(f"[FAIL] Failed to seed {name}: {response.status_code}")
                except Exception as e:
                    print(f"[ERROR] Error uploading {name}: {type(e).__name__}")

if __name__ == "__main__":
    templates = [
        create_fresher_modern(),
        create_fresher_classic(),
        create_experienced_professional(),
        create_experienced_executive()
    ]
    
    # Run async seeder
    asyncio.run(seed_database(templates))
