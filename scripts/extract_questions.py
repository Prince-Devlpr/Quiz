"""
Extracts quiz questions from 'answer sheet/Assignment X.pdf' (Weeks 1 to 12)
and generates 'src/ques.json' for the NPTEL Quiz React app.
"""
import re
import json
import os
from pypdf import PdfReader

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANSWER_DIR = os.path.join(BASE_DIR, 'answer sheet')
OUTPUT_JSON = os.path.join(BASE_DIR, 'src', 'ques.json')

def clean_text(text):
    header_patterns = [
        r'NPTEL\s+Online\s+Certification\s+Courses',
        r'Indian\s+Institute\s+of\s+Technology\s+Kharagpur',
        r'Cloud\s+Computing\s+Assignment-Week\s+\d+',
        r'Cloud\s+Computing',
        r'Assignment-Week\s+\d+',
        r'TYPE\s+OF\s+QUESTION:\s+MCQ/MSQ',
        r'Number\s+of\s+questions:\s*\d+\s*Total\s+mark:\s*\d+\s*X\s*\d+\s*=\s*\d+',
        r'Total\s+mark:\s*\d+\s*X\s*\d+\s*=\s*\d+',
    ]
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        is_header = False
        for pat in header_patterns:
            if re.fullmatch(pat, stripped, re.IGNORECASE):
                is_header = True
                break
        if not is_header:
            cleaned_lines.append(line)
    return '\n'.join(cleaned_lines)

def extract_all():
    all_questions = []
    global_id = 1

    for week in range(1, 13):
        pdf_path = os.path.join(ANSWER_DIR, f'Assignment {week}.pdf')
        if not os.path.exists(pdf_path):
            print(f"Skipping Week {week}: file not found at {pdf_path}")
            continue

        reader = PdfReader(pdf_path)
        first_page_def = reader.pages[0].extract_text()
        has_newline_words = 'Online\n' in first_page_def

        mode = 'layout' if has_newline_words else None
        if mode == 'layout':
            full_text = '\n'.join([page.extract_text(extraction_mode='layout') for page in reader.pages])
        else:
            full_text = '\n'.join([page.extract_text() for page in reader.pages])

        full_text = clean_text(full_text)
        parts = re.split(r'\n\s*QUESTION\s+(\d+)\s*:', full_text, flags=re.IGNORECASE)
        found_count = (len(parts) - 1) // 2
        print(f"Week {week:2d} (mode={mode or 'default'}): found {found_count} questions")

        for i in range(1, len(parts), 2):
            q_num = int(parts[i])
            content = parts[i+1]

            ans_match = re.search(r'\n\s*(?:Correct\s+)?(?:Answer|Option)\s*:\s*([^\n]+)', content, re.IGNORECASE)
            if not ans_match:
                print(f"ERROR: No answer found in Week {week} Q{q_num}")
                continue

            ans_raw = ans_match.group(1).strip()
            q_and_opts = content[:ans_match.start()]
            opt_splits = re.split(r'\n\s*([A-D])[\.:\)]\s+', '\n' + q_and_opts)
            q_text = " ".join(opt_splits[0].split()).strip()

            options_dict = {}
            for j in range(1, len(opt_splits), 2):
                letter = opt_splits[j].strip().upper()
                opt_val = " ".join(opt_splits[j+1].split()).strip()
                options_dict[letter] = opt_val

            ans_clean = ans_raw.rstrip('.').strip()
            ans_letters = re.findall(r'\b([A-D])\b', ans_clean.upper())
            if not ans_letters:
                ans_letters = re.findall(r'([A-D])', ans_clean.upper())

            options_list = [options_dict.get(l, '') for l in ['A', 'B', 'C', 'D']]

            if len(ans_letters) == 1:
                answer_val = options_dict.get(ans_letters[0], '')
            else:
                answer_val = [options_dict.get(l, '') for l in ans_letters]

            item = {
                "id": global_id,
                "week": week,
                "question": q_text,
                "options": options_list,
                "answer": answer_val
            }

            all_questions.append(item)
            global_id += 1

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, indent=2, ensure_ascii=False)

    print(f"Successfully exported {len(all_questions)} questions to {OUTPUT_JSON}")

if __name__ == '__main__':
    extract_all()
