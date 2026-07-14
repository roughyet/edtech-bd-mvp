#!/usr/bin/env python3
"""
Download NCTB Class 9-10 books from official sources.
Run: python scripts/download_books.py

Books: Physics, Chemistry, Math, Higher Math (Bangla version)
Source: nctb.gov.bd (official) via Google Drive / egovcloud
"""

import os
import sys
import requests
from pathlib import Path

BOOKS_DIR = Path(__file__).parent.parent / "data" / "books"
BOOKS_DIR.mkdir(parents=True, exist_ok=True)

BOOKS = {
    "physics_bn": {
        "gdrive_id": "13P5E08HcNbpALj8-aC-RUCy0d3iwodet",
        "egovcloud": "https://drive.egovcloud.gov.bd/index.php/s/KOdI1T0gyhPiFRz/download",
        "name_bn": "পদার্থবিজ্ঞান",
        "name_en": "Physics",
    },
    "chemistry_bn": {
        "gdrive_id": "1lbgge3uWpQmuHOBvlxJ4AuPP2Na1RYQ8",
        "egovcloud": "https://drive.egovcloud.gov.bd/index.php/s/sDHVsdQgt7dVQzO/download",
        "name_bn": "রসায়ন",
        "name_en": "Chemistry",
    },
    "math_bn": {
        "gdrive_id": "1-Dj-9Y1Q79AWN7fViMR8fj4jvzDVNYYl",
        "egovcloud": "https://drive.egovcloud.gov.bd/index.php/s/HwrCrAtDhb9K484/download",
        "name_bn": "গণিত",
        "name_en": "Mathematics",
    },
    "higher_math_bn": {
        "gdrive_id": "18osCGwa0nHp-q3XgkjEFcoBqteORdiXE",
        "egovcloud": "https://drive.egovcloud.gov.bd/index.php/s/iSz6xhjfGbQnu4G/download",
        "name_bn": "উচ্চতর গণিত",
        "name_en": "Higher Mathematics",
    },
}


def download_from_gdrive(file_id: str, output_path: Path) -> bool:
    try:
        session = requests.Session()
        URL = "https://drive.google.com/uc?export=download"
        response = session.get(URL, params={"id": file_id}, stream=True, timeout=30)
        token = None
        for key, value in response.cookies.items():
            if key.startswith("download_warning"):
                token = value
                break
        if token:
            response = session.get(URL, params={"id": file_id, "confirm": token}, stream=True, timeout=30)
        total = 0
        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=65536):
                if chunk:
                    f.write(chunk)
                    total += len(chunk)
        return total / (1024 * 1024) > 0.5
    except Exception as e:
        print(f"    Google Drive failed: {e}")
        return False


def download_from_egovcloud(url: str, output_path: Path) -> bool:
    try:
        response = requests.get(url, stream=True, timeout=(30, 120), headers={"User-Agent": "Mozilla/5.0"})
        total = 0
        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=65536):
                if chunk:
                    f.write(chunk)
                    total += len(chunk)
        return total / (1024 * 1024) > 0.5
    except Exception as e:
        print(f"    egovcloud failed: {e}")
        return False


def main():
    print("=" * 60)
    print("📚 NCTB Book Downloader - Class 9-10 (Bangla)")
    print("=" * 60)
    success_count = 0
    fail_count = 0
    for book_id, info in BOOKS.items():
        output_path = BOOKS_DIR / f"{book_id}.pdf"
        if output_path.exists() and output_path.stat().st_size > 500000:
            size_mb = output_path.stat().st_size / (1024 * 1024)
            print(f"\n✅ {info['name_bn']} ({info['name_en']}) - Already downloaded ({size_mb:.1f} MB)")
            success_count += 1
            continue
        print(f"\n📥 Downloading {info['name_bn']} ({info['name_en']})...")
        print("  Trying egovcloud.gov.bd...")
        if download_from_egovcloud(info["egovcloud"], output_path):
            size_mb = output_path.stat().st_size / (1024 * 1024)
            print(f"  ✅ Downloaded: {size_mb:.1f} MB")
            success_count += 1
            continue
        print("  Trying Google Drive...")
        if download_from_gdrive(info["gdrive_id"], output_path):
            size_mb = output_path.stat().st_size / (1024 * 1024)
            print(f"  ✅ Downloaded: {size_mb:.1f} MB")
            success_count += 1
            continue
        print(f"  ❌ Failed to download {info['name_bn']}")
        fail_count += 1
    print("\n" + "=" * 60)
    print(f"📊 Results: {success_count} downloaded, {fail_count} failed")
    print(f"📁 Location: {BOOKS_DIR}")
    print("=" * 60)
    if fail_count > 0:
        print("\n⚠️  Some downloads failed. Try running again or download manually from:")
        print("   http://nctb.gov.bd/pages/static-pages/695b99afc4774958d7b70612")
        sys.exit(1)


if __name__ == "__main__":
    main()
