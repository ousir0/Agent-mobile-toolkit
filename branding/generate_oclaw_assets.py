from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path("/Users/ouwei/droidrun-portal/branding")
OUT = ROOT / "exports"
SRC = ROOT / "source"
APPROVED_ICON_MASTER = SRC / "oclaw-approved-icon-master.png"

BG_DARK = "#0A0A0A"
MINT = "#11C7A1"
INK = "#0D1117"
IVORY = "#F7F7F2"
AMBER = "#FFB84D"


def ensure_dirs() -> None:
    for path in [
        OUT / "mark",
        OUT / "icon",
        OUT / "lockup",
        OUT / "favicon",
        OUT / "android",
        OUT / "ios",
        SRC,
    ]:
        path.mkdir(parents=True, exist_ok=True)


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/SFNS.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_mark(draw: ImageDraw.ImageDraw, size: int, padding_ratio: float = 0.06) -> None:
    p = size * padding_ratio
    cx = cy = size / 2

    def box(ratio: float) -> tuple[float, float, float, float]:
        r = size * ratio
        return (cx - r, cy - r, cx + r, cy + r)

    draw.ellipse(box(0.5 - padding_ratio), fill=BG_DARK)
    draw.ellipse(box(0.405), fill=MINT)
    draw.ellipse(box(0.285), fill=INK)
    draw.ellipse(box(0.205), fill=IVORY)
    draw.ellipse(box(0.105), fill=INK)

    rays = [
        ((0.66, 0.32), (0.73, 0.18), (0.81, 0.22), (0.74, 0.36)),
        ((0.77, 0.43), (0.92, 0.40), (0.94, 0.48), (0.79, 0.51)),
        ((0.74, 0.58), (0.87, 0.67), (0.82, 0.75), (0.70, 0.65)),
        ((0.61, 0.72), (0.65, 0.88), (0.57, 0.90), (0.53, 0.74)),
    ]
    for points in rays:
        scaled = [(size * x, size * y) for x, y in points]
        draw.polygon(scaled, fill=AMBER)


def build_mark(size: int, transparent: bool = True) -> Image.Image:
    bg = (0, 0, 0, 0) if transparent else ImageColor.getrgb(BG_DARK) + (255,)
    image = Image.new("RGBA", (size, size), bg)
    draw = ImageDraw.Draw(image)
    draw_mark(draw, size)
    return image


def build_icon(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    radius = int(size * 0.224)
    draw.rounded_rectangle((0, 0, size, size), radius=radius, fill="#1E2023")

    cx = cy = size / 2

    def box(ratio: float) -> tuple[float, float, float, float]:
        r = size * ratio
        return (cx - r, cy - r, cx + r, cy + r)

    draw.ellipse(box(0.40), fill=BG_DARK)
    draw.ellipse(box(0.36), fill="#24C4AD")
    draw.ellipse(box(0.25), fill=INK)
    draw.ellipse(box(0.18), fill=IVORY)
    draw.ellipse(box(0.09), fill=INK)

    bars = [
        [(0.636, 0.216), (0.722, 0.176), (0.801, 0.347), (0.715, 0.386)],
        [(0.777, 0.368), (0.859, 0.353), (0.890, 0.528), (0.807, 0.543)],
        [(0.650, 0.600), (0.702, 0.534), (0.850, 0.650), (0.798, 0.716)],
        [(0.529, 0.694), (0.611, 0.682), (0.637, 0.869), (0.555, 0.880)],
    ]
    for points in bars:
        scaled = [(size * x, size * y) for x, y in points]
        draw.polygon(scaled, fill=AMBER)
    return image


def build_lockup(width: int, height: int) -> Image.Image:
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    icon_size = int(height * 0.78)
    icon = build_mark(icon_size, transparent=True)
    y = (height - icon_size) // 2
    image.alpha_composite(icon, (0, y))

    draw = ImageDraw.Draw(image)
    font = load_font(int(height * 0.36))
    small_font = load_font(int(height * 0.13))
    text_x = icon_size + int(height * 0.12)
    title_y = int(height * 0.24)
    subtitle_y = int(height * 0.66)
    draw.text((text_x, title_y), "OClaw", font=font, fill=INK)
    draw.text((text_x, subtitle_y), "Tools Bridge", font=small_font, fill=MINT)
    return image


def save_svg_sources() -> None:
    mark_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="none">
  <circle cx="512" cy="512" r="448" fill="#0A0A0A"/>
  <circle cx="512" cy="512" r="414" fill="#11C7A1"/>
  <circle cx="512" cy="512" r="292" fill="#0D1117"/>
  <path fill="#F7F7F2" d="M512 333c-99.4 0-180 80.6-180 180s80.6 180 180 180 180-80.6 180-180-80.6-180-180-180Zm0 84c53 0 96 43 96 96s-43 96-96 96-96-43-96-96 43-96 96-96Z"/>
  <path fill="#FFB84D" d="m683 330 63-106 64 42-64 107zm95 116 119-20 15 74-118 20zm-18 138 97 76-42 60-96-75zm-136 105 31 121-73 18-31-120z"/>
</svg>
"""
    (SRC / "oclaw-mark.svg").write_text(mark_svg)

    icon_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="none">
  <rect width="1024" height="1024" rx="228" fill="#1E2023"/>
  <circle cx="512" cy="512" r="410" fill="#0A0A0A"/>
  <circle cx="512" cy="512" r="370" fill="#24C4AD"/>
  <circle cx="512" cy="512" r="256" fill="#0D1117"/>
  <path fill="#F7F7F2" d="M512 307c-113.2 0-205 91.8-205 205s91.8 205 205 205 205-91.8 205-205-91.8-205-205-205Zm0 102c56.9 0 103 46.1 103 103S568.9 615 512 615 409 568.9 409 512s46.1-103 103-103Z"/>
  <path fill="#FFB84D" d="M651 221l84-39 78 168-84 39zM795 361l81-14 30 172-81 14zM639 590l51-64 145 113-51 64zM541 670l81-11 26 183-81 11z"/>
</svg>
"""
    (SRC / "oclaw-app-icon.svg").write_text(icon_svg)


def export_png_sets() -> None:
    mark_sizes = [1024, 512, 256, 128, 64]
    favicon_sizes = [32, 16]
    icon_sizes = [1024, 512, 256, 192, 180, 152, 144, 128, 96, 72, 64, 48, 32]
    android_foreground_sizes = [432, 324, 216, 162, 108]

    for size in mark_sizes:
        build_mark(size).save(OUT / "mark" / f"oclaw-mark-{size}.png")
    for size in favicon_sizes:
        build_mark(size).save(OUT / "favicon" / f"favicon-{size}.png")
    approved_master = None
    if APPROVED_ICON_MASTER.exists():
        approved_master = Image.open(APPROVED_ICON_MASTER).convert("RGBA")

    for size in icon_sizes:
        if approved_master is not None:
            ImageOps.contain(approved_master, (size, size)).save(
                OUT / "icon" / f"oclaw-icon-{size}.png"
            )
        else:
            build_icon(size).save(OUT / "icon" / f"oclaw-icon-{size}.png")

    lockup_sizes = [(1600, 512), (1200, 384), (800, 256)]
    for width, height in lockup_sizes:
        build_lockup(width, height).save(OUT / "lockup" / f"oclaw-lockup-{width}x{height}.png")

    for size in android_foreground_sizes:
        if approved_master is not None:
            ImageOps.contain(approved_master, (size, size)).save(
                OUT / "android" / f"oclaw-foreground-{size}.png"
            )
        else:
            build_icon(size).save(OUT / "android" / f"oclaw-foreground-{size}.png")

    if approved_master is not None:
        ImageOps.contain(approved_master, (1024, 1024)).save(
            OUT / "ios" / "oclaw-app-store-1024.png"
        )
        ImageOps.contain(approved_master, (180, 180)).save(
            OUT / "ios" / "oclaw-apple-touch-180.png"
        )
    else:
        build_icon(1024).save(OUT / "ios" / "oclaw-app-store-1024.png")
        build_icon(180).save(OUT / "ios" / "oclaw-apple-touch-180.png")
    build_mark(512).save(OUT / "ios" / "oclaw-mark-512.png")


def write_readme() -> None:
    content = """# OClaw Brand Exports

## mark
- Transparent main logo for web/client use.

## icon
- Rounded square app icon exports with safe padding.

## lockup
- Horizontal logo with text for websites and desktop clients.

## android
- Foreground-only icon exports for Android/adaptive icon workflows.

## ios
- Common iOS marketing/icon assets.
"""
    (OUT / "README.md").write_text(content)


def main() -> None:
    ensure_dirs()
    save_svg_sources()
    export_png_sets()
    write_readme()


if __name__ == "__main__":
    # Imported lazily to keep the main drawing logic simple.
    from PIL import ImageColor

    main()
