#!/usr/bin/env python3
"""
Process NCTB PDF books: extract text, chunk by chapters/topics,
and prepare for vector embedding.

Run: python scripts/process_books.py
Prerequisites: pip install pdfplumber
"""

import os
import sys
import re
import json
import hashlib
from pathlib import Path
from typing import List, Dict, Optional

import pdfplumber

BOOKS_DIR = Path(__file__).parent.parent / "data" / "books"
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "processed"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BOOK_CONFIG = {
    "physics_bn": {
        "name_bn": "পদার্থবিজ্ঞান",
        "name_en": "Physics",
        "class_level": 9,
        "chapters": [
            {"num": 1, "title_bn": "ভৌত রাশি ও পরিমাপ", "page_start": 1},
            {"num": 2, "title_bn": "গতি", "page_start": 17},
            {"num": 3, "title_bn": "বল", "page_start": 39},
            {"num": 4, "title_bn": "কাজ, ক্ষমতা ও শক্তি", "page_start": 61},
            {"num": 5, "title_bn": "পদার্থের অবস্থা ও চাপ", "page_start": 79},
            {"num": 6, "title_bn": "বস্তুর উপর তাপের প্রভাব", "page_start": 99},
            {"num": 7, "title_bn": "তরঙ্গ ও শব্দ", "page_start": 119},
            {"num": 8, "title_bn": "আলোর প্রতিফলন", "page_start": 141},
            {"num": 9, "title_bn": "আলোর প্রতিসরণ", "page_start": 165},
            {"num": 10, "title_bn": "স্থিতিবিদ্যুৎ", "page_start": 189},
            {"num": 11, "title_bn": "চলবিদ্যুৎ", "page_start": 209},
            {"num": 12, "title_bn": "বিদ্যুতের চৌম্বক ক্রিয়া", "page_start": 233},
            {"num": 13, "title_bn": "আধুনিক পদার্থবিজ্ঞান ও ইলেকট্রনিকস", "page_start": 253},
            {"num": 14, "title_bn": "জীবন বাঁচাতে পদার্থবিজ্ঞান", "page_start": 275},
        ],
    },
    "chemistry_bn": {
        "name_bn": "রসায়ন",
        "name_en": "Chemistry",
        "class_level": 9,
        "chapters": [
            {"num": 1, "title_bn": "রসায়নের ধারণা", "page_start": 1},
            {"num": 2, "title_bn": "পদার্থের অবস্থা", "page_start": 19},
            {"num": 3, "title_bn": "পদার্থের গঠন", "page_start": 37},
            {"num": 4, "title_bn": "পর্যায় সারণি", "page_start": 61},
            {"num": 5, "title_bn": "রাসায়নিক বন্ধন", "page_start": 81},
            {"num": 6, "title_bn": "মোলের ধারণা ও রাসায়নিক গণনা", "page_start": 103},
            {"num": 7, "title_bn": "রাসায়নিক বিক্রিয়া", "page_start": 125},
            {"num": 8, "title_bn": "রসায়ন ও শক্তি", "page_start": 149},
            {"num": 9, "title_bn": "এসিড-ক্ষারকের ভারসাম্য", "page_start": 169},
            {"num": 10, "title_bn": "খনিজ সম্পদ: ধাতু-অধাতু", "page_start": 191},
            {"num": 11, "title_bn": "খনিজ সম্পদ: জীবাশ্ম", "page_start": 213},
            {"num": 12, "title_bn": "আমাদের জীবনে রসায়ন", "page_start": 233},
        ],
    },
    "math_bn": {
        "name_bn": "গণিত",
        "name_en": "Mathematics",
        "class_level": 9,
        "chapters": [
            {"num": 1, "title_bn": "বাস্তব সংখ্যা", "page_start": 1},
            {"num": 2, "title_bn": "সেট ও ফাংশন", "page_start": 23},
            {"num": 3, "title_bn": "বীজগাণিতিক রাশি", "page_start": 43},
            {"num": 4, "title_bn": "সূচক ও লগারিদম", "page_start": 65},
            {"num": 5, "title_bn": "এক চলকবিশিষ্ট সমীকরণ", "page_start": 85},
            {"num": 6, "title_bn": "রেখা, কোণ ও ত্রিভুজ", "page_start": 105},
            {"num": 7, "title_bn": "ব্যবহারিক জ্যামিতি", "page_start": 127},
            {"num": 8, "title_bn": "বৃত্ত", "page_start": 149},
            {"num": 9, "title_bn": "ত্রিকোণমিতিক অনুপাত", "page_start": 171},
            {"num": 10, "title_bn": "দূরত্ব ও উচ্চতা", "page_start": 193},
            {"num": 11, "title_bn": "বীজগাণিতিক অনুপাত ও সমানুপাত", "page_start": 211},
            {"num": 12, "title_bn": "দুই চলকবিশিষ্ট সরল সহসমীকরণ", "page_start": 231},
            {"num": 13, "title_bn": "সসীম ধারা", "page_start": 253},
            {"num": 14, "title_bn": "অনুপাত, সদৃশতা ও প্রতিসমতা", "page_start": 271},
            {"num": 15, "title_bn": "ক্ষেত্রফল সম্পর্কিত উপপাদ্য ও সম্পাদ্য", "page_start": 291},
            {"num": 16, "title_bn": "পরিমিতি", "page_start": 311},
            {"num": 17, "title_bn": "পরিসংখ্যান", "page_start": 331},
        ],
    },
    "higher_math_bn": {
        "name_bn": "উচ্চতর গণিত",
        "name_en": "Higher Mathematics",
        "class_level": 9,
        "chapters": [
            {"num": 1, "title_bn": "সেট ও ফাংশন", "page_start": 1},
            {"num": 2, "title_bn": "বীজগাণিতিক রাশি", "page_start": 25},
            {"num": 3, "title_bn": "জ্যামিতি", "page_start": 51},
            {"num": 4, "title_bn": "জ্যামিতিক অঙ্কন", "page_start": 75},
            {"num": 5, "title_bn": "সমীকরণ", "page_start": 99},
            {"num": 6, "title_bn": "অসমতা", "page_start": 121},
            {"num": 7, "title_bn": "অসীম ধারা", "page_start": 143},
            {"num": 8, "title_bn": "ত্রিকোণমিতি", "page_start": 165},
            {"num": 9, "title_bn": "সূচকীয় ও লগারিদমীয় ফাংশন", "page_start": 189},
            {"num": 10, "title_bn": "দ্বিপদী বিস্তৃতি", "page_start": 211},
            {"num": 11, "title_bn": "স্থানাঙ্ক জ্যামিতি", "page_start": 231},
            {"num": 12, "title_bn": "সমতলীয় ভেক্টর", "page_start": 253},
            {"num": 13, "title_bn": "ঘনবস্তু", "page_start": 275},
            {"num": 14, "title_bn": "সম্ভাবনা", "page_start": 297},
        ],
    },
}

CHUNK_SIZE = 400
CHUNK_OVERLAP = 50


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 3)


def extract_text_from_pdf(pdf_path: Path) -> Dict[int, str]:
    pages = {}
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages, start=1):
                text = page.extract_text() or ""
                text = re.sub(r"\s+", " ", text).strip()
                if text:
                    pages[i] = text
    except Exception as e:
        print(f"  Error reading {pdf_path}: {e}")
    return pages


def get_chapter_for_page(page_num: int, chapters: List[Dict]) -> Optional[Dict]:
    for i, chapter in enumerate(chapters):
        next_start = chapters[i + 1]["page_start"] if i + 1 < len(chapters) else float("inf")
        if chapter["page_start"] <= page_num < next_start:
            return chapter
    return None


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    sentences = re.split(r"(?<=[।.!?])\s+", text)
    chunks = []
    current_chunk = []
    current_tokens = 0
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        sentence_tokens = estimate_tokens(sentence)
        if current_tokens + sentence_tokens > chunk_size and current_chunk:
            chunk_text = " ".join(current_chunk)
            chunks.append(chunk_text)
            overlap_text = " ".join(current_chunk[-2:]) if len(current_chunk) > 1 else ""
            current_chunk = [overlap_text] if overlap_text else []
            current_tokens = estimate_tokens(overlap_text)
        current_chunk.append(sentence)
        current_tokens += sentence_tokens
    if current_chunk:
        chunk_text = " ".join(current_chunk)
        if estimate_tokens(chunk_text) > 20:
            chunks.append(chunk_text)
    return chunks


def process_book(book_id: str, config: Dict) -> List[Dict]:
    pdf_path = BOOKS_DIR / f"{book_id}.pdf"
    if not pdf_path.exists():
        print(f"  ❌ PDF not found: {pdf_path}")
        return []
    print(f"\n📖 Processing {config['name_bn']} ({config['name_en']})...")
    print(f"  File: {pdf_path} ({pdf_path.stat().st_size / (1024*1024):.1f} MB)")
    pages = extract_text_from_pdf(pdf_path)
    print(f"  Extracted {len(pages)} pages")
    if not pages:
        print("  ❌ No text extracted!")
        return []
    all_chunks = []
    for page_num, text in sorted(pages.items()):
        chapter = get_chapter_for_page(page_num, config["chapters"])
        if not chapter:
            continue
        page_chunks = chunk_text(text)
        for i, chunk in enumerate(page_chunks):
            chunk_hash = hashlib.sha256(chunk.encode()).hexdigest()[:16]
            all_chunks.append({
                "book_id": book_id,
                "subject_bn": config["name_bn"],
                "subject_en": config["name_en"],
                "class_level": config["class_level"],
                "chapter_num": chapter["num"],
                "chapter_title_bn": chapter["title_bn"],
                "page_number": page_num,
                "chunk_index": i,
                "text_content": chunk,
                "text_hash": chunk_hash,
                "token_count": estimate_tokens(chunk),
            })
    print(f"  Created {len(all_chunks)} chunks")
    output_path = OUTPUT_DIR / f"{book_id}_chunks.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, ensure_ascii=False, indent=2)
    print(f"  Saved to {output_path}")
    return all_chunks


def main():
    print("=" * 60)
    print("📚 NCTB Book Processor - Extract & Chunk")
    print("=" * 60)
    total_chunks = 0
    for book_id, config in BOOK_CONFIG.items():
        chunks = process_book(book_id, config)
        total_chunks += len(chunks)
    print("\n" + "=" * 60)
    print(f"📊 Total chunks created: {total_chunks}")
    print(f"📁 Output directory: {OUTPUT_DIR}")
    print("=" * 60)
    print("\n✅ Next step: Run scripts/upload_to_supabase.py")


if __name__ == "__main__":
    main()
