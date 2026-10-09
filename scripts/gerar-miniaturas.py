"""Gera miniaturas (240 px) das fotos usadas nos cartões da vitrine.

Uso: python scripts/gerar-miniaturas.py
Lê vitrine.json e catalogo.json; as fotos originais em assets/catalog não são alteradas.
Produtos sem miniatura continuam funcionando: o site usa a foto original como alternativa.
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SIZE = 240

catalog = json.loads((ROOT / "catalogo.json").read_text(encoding="utf-8"))
showcase = json.loads((ROOT / "vitrine.json").read_text(encoding="utf-8"))
by_id = {product["id"]: product for product in catalog["products"]}
out_dir = ROOT / "assets" / "catalog" / "thumbs"
out_dir.mkdir(parents=True, exist_ok=True)

total = 0
for group in showcase["groups"]:
    for product_id in group["productIds"]:
        source = ROOT / by_id[product_id]["image"]
        target = out_dir / source.name
        with Image.open(source) as image:
            image = image.convert("RGBA") if image.mode in ("RGBA", "LA", "P") else image.convert("RGB")
            image.thumbnail((SIZE, SIZE), Image.LANCZOS)
            image.save(target, "WEBP", quality=82, method=6)
        total += target.stat().st_size

print(f"{len(list(out_dir.glob('*.webp')))} miniaturas, {total / 1024:.0f} KB")
