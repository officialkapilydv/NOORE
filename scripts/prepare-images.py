"""Prepare NOORÉ catalog imagery: upscale tiny product shots, crop banners, sample palettes."""
import glob, os, re
from PIL import Image, ImageFilter, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "NOORE_Product_Catalog", "NOORE_Product_Catalog")
OUT_PRODUCTS = os.path.join(ROOT, "server", "public", "images", "products")
OUT_BANNERS = os.path.join(ROOT, "server", "public", "images", "banners")
os.makedirs(OUT_PRODUCTS, exist_ok=True); os.makedirs(OUT_BANNERS, exist_ok=True)

def slug_from(path):
    base = os.path.splitext(os.path.basename(path))[0]
    base = re.sub(r"^\d+_", "", base).replace("_and_", "-and-").replace("_", "-")
    return base

def avg_hex(im, box):
    region = im.crop(box).resize((1, 1), Image.LANCZOS)
    r, g, b = region.getpixel((0, 0))[:3]
    return "#%02x%02x%02x" % (r, g, b)

print("slug | vessel(mid) | wax(top) | bg")
for f in sorted(glob.glob(os.path.join(SRC, "*", "*.jpg"))):
    if "Website_Homepage_Catalog" in f: continue
    slug = slug_from(f)
    im = Image.open(f).convert("RGB")
    w, h = im.size
    # 3x upscale with Lanczos + gentle sharpening; keeps a soft, filmic look rather than crunchy edges
    up = im.resize((w * 3, h * 3), Image.LANCZOS)
    up = up.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))
    up = ImageEnhance.Contrast(up).enhance(1.04)
    up.save(os.path.join(OUT_PRODUCTS, f"{slug}.jpg"), quality=90, optimize=True, progressive=True)
    vessel = avg_hex(im, (int(w*0.38), int(h*0.62), int(w*0.62), int(h*0.80)))
    wax = avg_hex(im, (int(w*0.40), int(h*0.40), int(w*0.60), int(h*0.50)))
    bg = avg_hex(im, (0, 0, int(w*0.2), int(h*0.2)))
    print(f"{slug} | {vessel} | {wax} | {bg}")

hero = Image.open(os.path.join(SRC, "Website_Homepage_Catalog", "homepage_hero_banner.jpg")).convert("RGB")
hero.crop((0, 0, 858, 330)).save(os.path.join(OUT_BANNERS, "hero-lifestyle.jpg"), quality=90, optimize=True)
hero.crop((1100, 0, 1536, 330)).save(os.path.join(OUT_BANNERS, "hero-trio.jpg"), quality=90, optimize=True)
hero.save(os.path.join(OUT_BANNERS, "hero-full.jpg"), quality=88, optimize=True)

gift = Image.open(os.path.join(SRC, "Website_Homepage_Catalog", "gifting_and_brand_banners.jpg")).convert("RGB")
panels = {"gifting": (0, 0, 408, 244), "signature-space": (412, 0, 806, 244), "corporate": (810, 0, 1204, 244), "moments": (1208, 0, 1536, 244)}
for name, box in panels.items():
    gift.crop(box).save(os.path.join(OUT_BANNERS, f"{name}.jpg"), quality=90, optimize=True)

full = Image.open(os.path.join(SRC, "Website_Homepage_Catalog", "noore_homepage_catalog_full.jpg")).convert("RGB")
full.save(os.path.join(OUT_BANNERS, "catalog-full.jpg"), quality=85, optimize=True)
print("done")
