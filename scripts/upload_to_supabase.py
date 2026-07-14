#!/usr/bin/env python3
"""
Upload processed book chunks to Supabase with vector embeddings.

Run: python scripts/upload_to_supabase.py

Environment variables (set in .env or export):
  SUPABASE_URL, SUPABASE_ANON_KEY, NIM_API_KEY
"""

import os
import sys
import json
from pathlib import Path
from typing import List, Dict

OUTPUT_DIR = Path(__file__).parent.parent / "data" / "processed"

env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
NIM_API_KEY = os.environ.get("NIM_API_KEY", "")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env")
    sys.exit(1)

GENERATE_EMBEDDINGS = bool(NIM_API_KEY and NIM_API_KEY != "nvapi-REPLACE_WITH_YOUR_KEY")
if not GENERATE_EMBEDDINGS:
    print("⚠️  NIM_API_KEY not set. Will skip embedding generation.")

from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_or_create_subject(name_bn: str, name_en: str, class_level: int) -> int:
    result = supabase.table("subjects").select("id").eq("name_en", name_en).eq("class_level", class_level).execute()
    if result.data:
        return result.data[0]["id"]
    result = supabase.table("subjects").insert({"name_en": name_en, "name_bn": name_bn, "class_level": class_level}).execute()
    return result.data[0]["id"]


def get_or_create_chapter(subject_id: int, chapter_num: int, title_bn: str) -> int:
    result = supabase.table("chapters").select("id").eq("subject_id", subject_id).eq("chapter_number", chapter_num).execute()
    if result.data:
        return result.data[0]["id"]
    result = supabase.table("chapters").insert({"subject_id": subject_id, "chapter_number": chapter_num, "title_bn": title_bn}).execute()
    return result.data[0]["id"]


def generate_embedding(text: str) -> List[float]:
    from openai import OpenAI
    client = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=NIM_API_KEY)
    response = client.embeddings.create(
        model="nvidia/llama-3.2-nv-embedqa-1b-v2",
        input=[text],
        encoding_format="float",
    )
    return response.data[0].embedding


def upload_book_chunks(book_id: str) -> int:
    chunks_path = OUTPUT_DIR / f"{book_id}_chunks.json"
    if not chunks_path.exists():
        print(f"  ❌ Chunks not found: {chunks_path}")
        print(f"     Run process_books.py first!")
        return 0

    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    print(f"\n📖 Uploading {book_id} ({len(chunks)} chunks)...")

    first = chunks[0]
    subject_id = get_or_create_subject(first["subject_bn"], first["subject_en"], first["class_level"])

    chapter_ids = {}
    for chunk in chunks:
        key = chunk["chapter_num"]
        if key not in chapter_ids:
            chapter_ids[key] = get_or_create_chapter(subject_id, chunk["chapter_num"], chunk["chapter_title_bn"])

    print(f"  Subject ID: {subject_id}, Chapters: {len(chapter_ids)}")

    batch_size = 50
    uploaded = 0
    skipped = 0

    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        rows = []
        for chunk in batch:
            existing = supabase.table("content_chunks").select("id").eq("text_hash", chunk["text_hash"]).execute()
            if existing.data:
                skipped += 1
                continue
            row = {
                "chapter_id": chapter_ids[chunk["chapter_num"]],
                "subject_id": subject_id,
                "chunk_index": chunk["chunk_index"],
                "text_content": chunk["text_content"],
                "text_hash": chunk["text_hash"],
                "page_number": chunk["page_number"],
                "section_title": chunk["chapter_title_bn"],
                "token_count": chunk["token_count"],
            }
            if GENERATE_EMBEDDINGS:
                try:
                    row["embedding"] = generate_embedding(chunk["text_content"])
                except Exception as e:
                    print(f"    ⚠️ Embedding failed: {e}")
            rows.append(row)
        if rows:
            try:
                supabase.table("content_chunks").insert(rows).execute()
                uploaded += len(rows)
            except Exception as e:
                print(f"    ❌ Batch insert failed: {e}")
        print(f"  Progress: {min(i + batch_size, len(chunks))}/{len(chunks)} (uploaded: {uploaded}, skipped: {skipped})")

    print(f"  ✅ Done: {uploaded} uploaded, {skipped} skipped")
    return uploaded


def main():
    print("=" * 60)
    print("☁️  Upload to Supabase - Vector Database")
    print("=" * 60)
    books = ["physics_bn", "chemistry_bn", "math_bn", "higher_math_bn"]
    total = 0
    for book_id in books:
        count = upload_book_chunks(book_id)
        total += count
    print("\n" + "=" * 60)
    print(f"📊 Total chunks uploaded: {total}")
    print("=" * 60)
    print("\n✅ Your knowledge base is ready!")


if __name__ == "__main__":
    main()
