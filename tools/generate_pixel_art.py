#!/usr/bin/env python3
"""
Pixel Art Asset Generator for Ashes of Bronze (Dune II 1992 Style).
Generates authentic 2D PNG sprites, tiles, and buildings with:
- 1-pixel dark outlines
- 1990s Westwood 256-color style indexed shading
- Dithered surfaces, corner bolts, hazard stripes, glowing hoppers, and mechanical details.
"""

import os
from PIL import Image, ImageDraw

TILE_SIZE = 32

# Palettes (1992 Westwood RTS inspired)
PAL_SAND = ["#e2af63", "#cf9b4c", "#b88339", "#9e6c27", "#7d5017"]
PAL_ROCK = ["#6b5847", "#544334", "#403225", "#2e2217", "#1c140d"]
PAL_COPPER = ["#80ffdb", "#48e5a7", "#2bb673", "#1a8550", "#0e5230"]
PAL_TIN = ["#ffffff", "#e2e8f0", "#94a3b8", "#64748b", "#334155"]
PAL_IRON = ["#948a85", "#5c5450", "#3d3633", "#241f1d", "#120f0e"]
PAL_WATER = ["#70b5f5", "#3b82f6", "#1d4ed8", "#1e3a8a", "#0f172a"]
PAL_CONCRETE = ["#d4cbbd", "#b0a394", "#8a7e70", "#63584c", "#3d352c"]
PAL_BRONZE = ["#fff275", "#ffd166", "#c9933b", "#8f621e", "#54370c"]
PAL_HAZARD = ["#ffd166", "#1c140d"]
PAL_TEAM_PLAYER = ["#5eead4", "#2dd4bf", "#0d9488", "#115e59", "#042f2e"] # Atreides-style Royal Teal
PAL_TEAM_ENEMY = ["#f87171", "#ef4444", "#b91c1c", "#7f1d1d", "#450a0a"] # Harkonnen Crimson

def hex_to_rgb(hex_str, alpha=255):
    h = hex_str.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4)) + (alpha,)

def draw_dither(img, x, y, w, h, col1, col2):
    for cy in range(y, y + h):
        for cx in range(x, x + w):
            col = col1 if (cx + cy) % 2 == 0 else col2
            img.putpixel((cx, cy), col)

def draw_bevel_box(draw, x, y, w, h, fill_col, hi_col, sh_col, outline_col="#000000"):
    draw.rectangle([x, y, x + w - 1, y + h - 1], fill=fill_col, outline=outline_col)
    draw.line([x + 1, y + 1, x + w - 2, y + 1], fill=hi_col)
    draw.line([x + 1, y + 1, x + 1, y + h - 2], fill=hi_col)
    draw.line([x + 2, y + h - 2, x + w - 2, y + h - 2], fill=sh_col)
    draw.line([x + w - 2, y + 2, x + w - 2, y + h - 2], fill=sh_col)

# ============================================================================
# 1. TILES (32x32)
# ============================================================================
def generate_tiles():
    os.makedirs("public/assets/tiles", exist_ok=True)

    # A. Desert Sand (Mustard Dunes with subtle wind ripples)
    img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), hex_to_rgb(PAL_SAND[1]))
    draw = ImageDraw.Draw(img)
    # Ripple waves
    for cy in (6, 15, 24):
        for cx in range(3, 28):
            if (cx + cy) % 3 != 0:
                img.putpixel((cx, cy), hex_to_rgb(PAL_SAND[0]))
                img.putpixel((cx, cy + 1), hex_to_rgb(PAL_SAND[2]))
    img.save("public/assets/tiles/tile_sand.png")

    # B. Rock Plateau (Dune II Slate Bedrock)
    img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), hex_to_rgb(PAL_ROCK[2]))
    draw = ImageDraw.Draw(img)
    draw_bevel_box(draw, 1, 1, 30, 30, hex_to_rgb(PAL_ROCK[1]), hex_to_rgb(PAL_ROCK[0]), hex_to_rgb(PAL_ROCK[3]), outline_col=hex_to_rgb(PAL_ROCK[4]))
    # Chiseled fissures
    draw.line([6, 8, 14, 16], fill=hex_to_rgb(PAL_ROCK[4]))
    draw.line([14, 16, 24, 14], fill=hex_to_rgb(PAL_ROCK[4]))
    img.save("public/assets/tiles/tile_rock.png")

    # C. Malachite Copper Ore Field (Vibrant glittering green spice)
    img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), hex_to_rgb(PAL_SAND[1]))
    draw = ImageDraw.Draw(img)
    # Ore mounds
    mounds = [(8, 8, 10), (18, 16, 12), (10, 20, 8)]
    for mx, my, mr in mounds:
        draw.ellipse([mx - mr//2, my - mr//2, mx + mr//2, my + mr//2], fill=hex_to_rgb(PAL_COPPER[3]))
        draw.ellipse([mx - mr//2 + 1, my - mr//2 + 1, mx + mr//2 - 1, my + mr//2 - 1], fill=hex_to_rgb(PAL_COPPER[2]))
        img.putpixel((mx - 1, my - 1), hex_to_rgb(PAL_COPPER[0]))
        img.putpixel((mx, my - 1), hex_to_rgb(PAL_COPPER[0]))
    img.save("public/assets/tiles/tile_ore_copper.png")

    # D. Cassiterite Tin Ore Field (Gleaming silver crystals)
    img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), hex_to_rgb(PAL_SAND[1]))
    draw = ImageDraw.Draw(img)
    mounds = [(10, 10, 9), (19, 14, 11), (12, 21, 9)]
    for mx, my, mr in mounds:
        draw.ellipse([mx - mr//2, my - mr//2, mx + mr//2, my + mr//2], fill=hex_to_rgb(PAL_TIN[3]))
        draw.ellipse([mx - mr//2 + 1, my - mr//2 + 1, mx + mr//2 - 1, my + mr//2 - 1], fill=hex_to_rgb(PAL_TIN[2]))
        img.putpixel((mx - 1, my - 1), hex_to_rgb(PAL_TIN[0]))
        img.putpixel((mx, my - 1), hex_to_rgb(PAL_TIN[0]))
    img.save("public/assets/tiles/tile_ore_tin.png")

    # E. Hematite Iron Ore Field (Black basalt ridge)
    img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), hex_to_rgb(PAL_SAND[1]))
    draw = ImageDraw.Draw(img)
    draw.rectangle([4, 6, 26, 26], fill=hex_to_rgb(PAL_IRON[3]), outline=hex_to_rgb(PAL_IRON[4]))
    draw.rectangle([7, 9, 23, 23], fill=hex_to_rgb(PAL_IRON[2]))
    img.save("public/assets/tiles/tile_ore_iron.png")

    # F. Deep Sea / Coast Water
    img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), hex_to_rgb(PAL_WATER[2]))
    draw = ImageDraw.Draw(img)
    for cy in (7, 18, 27):
        draw.line([4, cy, 14, cy], fill=hex_to_rgb(PAL_WATER[0]))
        draw.line([16, cy + 2, 28, cy + 2], fill=hex_to_rgb(PAL_WATER[1]))
    img.save("public/assets/tiles/tile_water.png")

# ============================================================================
# 2. BUILDINGS (Dune II 1992 Pixel Art Style)
# ============================================================================
def generate_buildings():
    os.makedirs("public/assets/buildings", exist_ok=True)

    # 0. The Legendary Concrete Slabs -> Cyclopean Foundation Slabs (2x2 tiles = 64x64)
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Base shadow
    draw.rectangle([2, 4, 62, 62], fill=hex_to_rgb("#100c09", 180))
    # 4 distinct beveled quadrants
    quads = [(1, 1, 30, 30), (33, 1, 30, 30), (1, 33, 30, 30), (33, 33, 30, 30)]
    for qx, qy, qw, qh in quads:
        draw_bevel_box(draw, qx, qy, qw, qh, hex_to_rgb(PAL_CONCRETE[2]), hex_to_rgb(PAL_CONCRETE[0]), hex_to_rgb(PAL_CONCRETE[3]))
        # Internal surface noise & rivet bolts
        for bx, by in [(qx + 3, qy + 3), (qx + qw - 5, qy + 3), (qx + 3, qy + qh - 5), (qx + qw - 5, qy + qh - 5)]:
            draw.rectangle([bx, by, bx + 1, by + 1], fill=hex_to_rgb(PAL_BRONZE[1]))
            img.putpixel((bx - 1, by), hex_to_rgb("#000000"))
        # Mortar seam lines
        draw.line([qx + 6, qy + 12, qx + 24, qy + 12], fill=hex_to_rgb(PAL_CONCRETE[4]))
    # Center bronze junction seal
    draw_bevel_box(draw, 29, 29, 6, 6, hex_to_rgb(PAL_BRONZE[1]), hex_to_rgb(PAL_BRONZE[0]), hex_to_rgb(PAL_BRONZE[3]))
    img.save("public/assets/buildings/bldg_foundation.png")

    # 1. Megaron / Royal Acropolis Palace of the Wanax (4x4 tiles = 128x128)
    for owner, team_pal in [("player", PAL_TEAM_PLAYER), ("sea_peoples", PAL_TEAM_ENEMY)]:
        img = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        # Drop shadow
        draw.rectangle([8, 12, 122, 124], fill=hex_to_rgb("#000000", 170))
        # Cyclopean terrace plinth
        draw_bevel_box(draw, 4, 16, 120, 108, hex_to_rgb(PAL_CONCRETE[2]), hex_to_rgb(PAL_CONCRETE[0]), hex_to_rgb(PAL_CONCRETE[4]))
        # Monumental staircase
        for st in range(5):
            sw = 50 + st * 6
            sx = 64 - sw // 2
            sy = 96 + st * 4
            draw_bevel_box(draw, sx, sy, sw, 4, hex_to_rgb("#e0d7cd"), hex_to_rgb("#f5f0e8"), hex_to_rgb("#998d7e"))

        # Main Palace Hall
        draw_bevel_box(draw, 14, 28, 100, 70, hex_to_rgb(PAL_CONCRETE[1]), hex_to_rgb(PAL_CONCRETE[0]), hex_to_rgb(PAL_CONCRETE[3]))
        # Frieze band in lapis lazuli & gold
        draw.rectangle([14, 48, 114, 54], fill=hex_to_rgb("#1e3a8a"))
        draw.line([14, 48, 114, 48], fill=hex_to_rgb("#fbbf24"))
        draw.line([14, 54, 114, 54], fill=hex_to_rgb("#fbbf24"))

        # Terracotta tiled pitched roof
        roof_c = "#992b1b" if owner == "player" else "#1d4e89"
        roof_hi = "#d94834" if owner == "player" else "#2b6cb0"
        draw_bevel_box(draw, 10, 10, 108, 36, hex_to_rgb(roof_c), hex_to_rgb(roof_hi), hex_to_rgb("#3b100a"))
        # Triangular pediment with golden Wanax solar disc
        draw.polygon([(10, 48), (64, 18), (118, 48)], fill=hex_to_rgb("#e6dfd3"), outline=hex_to_rgb("#786e63"))
        draw.ellipse([58, 30, 70, 42], fill=hex_to_rgb("#fbbf24"), outline=hex_to_rgb("#b45309"))
        draw.ellipse([61, 33, 67, 39], fill=hex_to_rgb(roof_c))

        # Hearth chimney flue with smoke
        draw.rectangle([58, 4, 70, 14], fill=hex_to_rgb("#4a3e33"), outline=hex_to_rgb("#241c15"))
        draw.ellipse([60, -2, 68, 6], fill=hex_to_rgb("#f1f5f9", 140))

        # Minoan inverted red cedar colonnade
        for cx in (22, 36, 50, 76, 90, 104):
            draw.polygon([(cx - 3, 56), (cx + 3, 56), (cx + 2, 94), (cx - 2, 94)], fill=hex_to_rgb("#991b1b"))
            draw.rectangle([cx - 4, 54, cx + 4, 56], fill=hex_to_rgb("#fbbf24")) # Gold capital
            draw.rectangle([cx - 4, 94, cx + 4, 96], fill=hex_to_rgb("#1c1917")) # Black base

        # Bronze palace portal with lion relief studs
        draw_bevel_box(draw, 54, 58, 20, 38, hex_to_rgb("#2b1b11"), hex_to_rgb("#452a16"), hex_to_rgb("#120b06"))
        for by in (66, 76, 86):
            draw.rectangle([56, by, 58, by + 2], fill=hex_to_rgb("#fbbf24"))
            draw.rectangle([70, by, 72, by + 2], fill=hex_to_rgb("#fbbf24"))

        # Royal brazier urns flanking stairs
        for bx in (32, 96):
            draw.rectangle([bx - 3, 94, bx + 3, 108], fill=hex_to_rgb("#5c4f42"), outline=hex_to_rgb("#1f1914"))
            draw.ellipse([bx - 4, 90, bx + 4, 96], fill=hex_to_rgb("#b45309"))
            draw.ellipse([bx - 3, 89, bx + 3, 93], fill=hex_to_rgb("#f97316"))
            draw.rectangle([bx - 1, 88, bx + 1, 90], fill=hex_to_rgb("#fef08a"))

        # Ceremonial Wanax Gonfalons
        for fx in (16, 112):
            draw.line([fx, 10, fx, 44], fill=hex_to_rgb("#451a03"), width=2)
            draw.rectangle([fx + 2, 12, fx + 8, 30], fill=hex_to_rgb(team_pal[1]), outline=hex_to_rgb("#000000"))
        img.save(f"public/assets/buildings/bldg_acropolis_{owner}.png")

    # 2. Bronze Foundry & Refinery (3x3 tiles = 96x96)
    for owner, team_pal in [("player", PAL_TEAM_PLAYER), ("sea_peoples", PAL_TEAM_ENEMY)]:
        img = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        # Drop shadow
        draw.rectangle([6, 8, 92, 90], fill=hex_to_rgb("#000000", 170))
        # Ash-stained industrial stone platform
        draw_bevel_box(draw, 4, 6, 88, 84, hex_to_rgb("#3d3329"), hex_to_rgb("#594b3d"), hex_to_rgb("#1c1611"))

        # Central Stone Smelting Blast Furnace
        draw.polygon([(36, 18), (60, 18), (70, 56), (26, 56)], fill=hex_to_rgb("#574a3c"), outline=hex_to_rgb("#1c1610"))
        # Twin clay blast chimneys with smoke & sparks
        for chx in (40, 52):
            draw.rectangle([chx, 6, chx + 6, 18], fill=hex_to_rgb("#3b2e23"), outline=hex_to_rgb("#120d09"))
            draw.rectangle([chx + 1, 4, chx + 5, 6], fill=hex_to_rgb("#000000"))
            draw.rectangle([chx + 2, 1, chx + 4, 3], fill=hex_to_rgb("#fef08a")) # Spark
            draw.ellipse([chx + 1, -2, chx + 7, 3], fill=hex_to_rgb("#64748b", 120)) # Smoke

        # Incandescent blast hearth mouth
        draw.rectangle([42, 42, 54, 54], fill=hex_to_rgb("#140a04"))
        draw.rectangle([43, 44, 53, 53], fill=hex_to_rgb("#ff5500"))
        draw.rectangle([45, 46, 51, 51], fill=hex_to_rgb("#fef08a"))

        # Molten bronze casting stream into sand molds
        draw.rectangle([46, 54, 50, 64], fill=hex_to_rgb("#f59e0b"))
        draw.rectangle([32, 60, 50, 64], fill=hex_to_rgb("#f59e0b"))

        # Sand casting pit with molten and finished Oxhide Ingots
        draw.rectangle([10, 60, 42, 84], fill=hex_to_rgb("#6e5233"), outline=hex_to_rgb("#2b1b0b"))
        # Glowing casting ingot
        draw.rectangle([14, 64, 24, 70], fill=hex_to_rgb("#f97316"), outline=hex_to_rgb("#fef08a"))
        # Stacked finished bronze oxhide ingots on pallet
        for iy, ix in [(74, 14), (74, 26), (71, 20)]:
            draw.rectangle([ix, iy, ix + 8, iy + 4], fill=hex_to_rgb(PAL_BRONZE[1]), outline=hex_to_rgb("#451a03"))

        # Raw ore hopper with green copper malachite & silver cassiterite tin
        draw.rectangle([64, 26, 88, 56], fill=hex_to_rgb("#291c12"), outline=hex_to_rgb("#120a05"))
        draw.rectangle([66, 32, 74, 44], fill=hex_to_rgb("#059669")) # Green copper
        draw.rectangle([76, 32, 86, 44], fill=hex_to_rgb("#475569")) # Tin ore
        draw.rectangle([78, 34, 82, 38], fill=hex_to_rgb("#cbd5e1")) # Tin shine

        # Timber crane mast
        draw.rectangle([62, 10, 65, 56], fill=hex_to_rgb("#5c3a21"))
        draw.rectangle([54, 10, 82, 13], fill=hex_to_rgb("#5c3a21"))
        draw.ellipse([56, 14, 62, 20], fill=hex_to_rgb("#1c1917")) # Pulley

        # Blacksmith anvil & quenching water trough
        draw.rectangle([64, 68, 74, 78], fill=hex_to_rgb("#452a16")) # Stump
        draw.rectangle([62, 64, 76, 68], fill=hex_to_rgb(PAL_BRONZE[1]), outline=hex_to_rgb("#000000"))
        # Quench water basin
        draw.rectangle([78, 66, 90, 80], fill=hex_to_rgb("#3d3329"), outline=hex_to_rgb("#1a140e"))
        draw.rectangle([80, 68, 88, 78], fill=hex_to_rgb("#0284c7"))
        img.save(f"public/assets/buildings/bldg_foundry_{owner}.png")

    # 3. Granary & Water Well (2x2 tiles = 96x96)
    for owner, team_pal in [("player", PAL_TEAM_PLAYER), ("sea_peoples", PAL_TEAM_ENEMY)]:
        img = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        # Drop shadow
        draw.rectangle([6, 12, 92, 88], fill=hex_to_rgb("#000000", 140))
        # Stone yard terrace
        draw_bevel_box(draw, 4, 18, 88, 70, hex_to_rgb(PAL_CONCRETE[2]), hex_to_rgb(PAL_CONCRETE[0]), hex_to_rgb(PAL_CONCRETE[4]))

        # Granary storehouse stilt piers
        for px in (8, 22, 38, 50):
            draw.rectangle([px, 72, px + 8, 84], fill=hex_to_rgb("#4a4136"), outline=hex_to_rgb("#29221b"))
        # Elevated wooden floor
        draw.rectangle([6, 68, 58, 73], fill=hex_to_rgb("#5c3a21"), outline=hex_to_rgb("#382212"))

        # Mudbrick walls & timber framing
        draw_bevel_box(draw, 8, 28, 48, 40, hex_to_rgb("#c7b6a2"), hex_to_rgb("#e3d8cc"), hex_to_rgb("#857663"))
        for tx in (8, 30, 52):
            draw.rectangle([tx, 28, tx + 4, 68], fill=hex_to_rgb("#6b4423"))
        draw.rectangle([8, 46, 56, 49], fill=hex_to_rgb("#6b4423"))

        # Grain delivery doorway
        draw_bevel_box(draw, 14, 48, 14, 20, hex_to_rgb("#24160c"), hex_to_rgb("#422817"), hex_to_rgb("#0a0604"))
        draw.rectangle([16, 52, 18, 54], fill=hex_to_rgb("#fbbf24")) # Bronze stud

        # Pitched terracotta roof
        roof_c = "#992b1b" if owner == "player" else "#1d4e89"
        roof_hi = "#d94834" if owner == "player" else "#2b6cb0"
        draw_bevel_box(draw, 6, 8, 52, 22, hex_to_rgb(roof_c), hex_to_rgb(roof_hi), hex_to_rgb("#3b100a"))
        draw.polygon([(6, 12), (32, 2), (58, 12)], fill=hex_to_rgb("#e6dfd3"), outline=hex_to_rgb("#786e63"))

        # Grain sacks & amphorae
        for sx, sy in [(32, 68), (42, 70), (37, 62)]:
            draw.ellipse([sx, sy, sx + 9, sy + 7], fill=hex_to_rgb("#d97706"), outline=hex_to_rgb("#451a03"))
        draw.ellipse([32, 77, 36, 81], fill=hex_to_rgb("#fef08a")) # Spilled grain

        # Terracotta jar
        draw.ellipse([50, 64, 57, 76], fill=hex_to_rgb("#c2410c"), outline=hex_to_rgb("#431407"))

        # Freshwater Well (Right side)
        draw.ellipse([64, 52, 88, 76], fill=hex_to_rgb(PAL_CONCRETE[2]), outline=hex_to_rgb("#1f1a14"))
        # Deep sparkling water
        draw.ellipse([68, 56, 84, 72], fill=hex_to_rgb("#0284c7"), outline=hex_to_rgb("#e0f2fe"))
        draw.ellipse([72, 60, 80, 68], fill=hex_to_rgb("#082f49"))

        # Well timber posts & roof canopy
        draw.rectangle([66, 32, 69, 58], fill=hex_to_rgb("#5c3a21"))
        draw.rectangle([85, 32, 88, 58], fill=hex_to_rgb("#5c3a21"))
        draw.rectangle([64, 30, 90, 33], fill=hex_to_rgb("#5c3a21"))
        draw.polygon([(63, 30), (77, 22), (91, 30)], fill=hex_to_rgb("#3d2515"), outline=hex_to_rgb("#1f130a"))

        # Bucket & rope
        draw.line([77, 33, 77, 46], fill=hex_to_rgb("#e2ceb5"), width=1)
        draw.rectangle([74, 46, 80, 52], fill=hex_to_rgb("#78350f"), outline=hex_to_rgb("#fbbf24"))
        draw.rectangle([75, 47, 79, 49], fill=hex_to_rgb("#38bdf8"))

        # Water trough in front
        draw_bevel_box(draw, 64, 78, 24, 10, hex_to_rgb(PAL_CONCRETE[3]), hex_to_rgb(PAL_CONCRETE[1]), hex_to_rgb(PAL_CONCRETE[4]))
        draw.rectangle([66, 80, 86, 86], fill=hex_to_rgb("#38bdf8"))
        img.save(f"public/assets/buildings/bldg_granary_{owner}.png")

    # 4. Barracks / Infantry Depot (3x3 tiles = 144x144)
    for owner, team_pal in [("player", PAL_TEAM_PLAYER), ("sea_peoples", PAL_TEAM_ENEMY)]:
        img = Image.new("RGBA", (144, 144), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        # Drop shadow
        draw.rectangle([6, 16, 138, 138], fill=hex_to_rgb("#000000", 140))
        # Dirt drill yard
        draw_bevel_box(draw, 8, 20, 128, 116, hex_to_rgb("#694e30"), hex_to_rgb("#8c6b45"), hex_to_rgb("#2d1f11"))

        # Flagstone perimeter
        for fx in range(12, 132, 14):
            draw_bevel_box(draw, fx, 124, 12, 10, hex_to_rgb("#706659"), hex_to_rgb("#948777"), hex_to_rgb("#383027"))

        # Garrison quarters (rear-left)
        draw_bevel_box(draw, 10, 30, 82, 48, hex_to_rgb("#aba092"), hex_to_rgb("#d1c4b4"), hex_to_rgb("#706659"))

        # Roof
        roof_c = "#992b1b" if owner == "player" else "#1d4e89"
        roof_hi = "#d94834" if owner == "player" else "#2b6cb0"
        draw_bevel_box(draw, 8, 14, 86, 26, hex_to_rgb(roof_c), hex_to_rgb(roof_hi), hex_to_rgb("#4d120a"))

        # Pillared open portico recess
        draw.rectangle([14, 42, 88, 76], fill=hex_to_rgb("#261f18"))
        for px in (14, 38, 62, 84):
            draw.rectangle([px, 42, px + 5, 76], fill=hex_to_rgb("#5c3a21"), outline=hex_to_rgb("#382212"))

        # Double doorway
        draw.rectangle([45, 46, 60, 76], fill=hex_to_rgb("#140d08"))
        draw.rectangle([46, 48, 59, 76], fill=hex_to_rgb("#3d2515"))
        draw.rectangle([48, 60, 50, 62], fill=hex_to_rgb("#fbbf24"))

        # Weapons racks: shields and spears
        # Figure-eight shield
        draw.ellipse([21, 52, 28, 60], fill=hex_to_rgb("#78350f"), outline=hex_to_rgb("#fbbf24"))
        draw.ellipse([21, 60, 28, 70], fill=hex_to_rgb("#78350f"), outline=hex_to_rgb("#fbbf24"))
        # Tower shield
        draw_bevel_box(draw, 29, 50, 7, 18, hex_to_rgb("#78350f"), hex_to_rgb("#fbbf24"), hex_to_rgb("#451a03"))

        # Spear rack
        draw.rectangle([68, 68, 83, 71], fill=hex_to_rgb("#452a16"))
        for spx in range(70, 82, 3):
            draw.line([spx, 46, spx, 70], fill=hex_to_rgb("#92400e"), width=1)
            draw.polygon([(spx, 42), (spx + 1, 46), (spx - 1, 46)], fill=hex_to_rgb("#fbbf24"))

        # Weaponsmith forge (right wing)
        draw_bevel_box(draw, 94, 38, 40, 42, hex_to_rgb("#574e44"), hex_to_rgb("#756859"), hex_to_rgb("#332a22"))
        # Chimney
        draw.rectangle([118, 18, 130, 40], fill=hex_to_rgb("#4a3f34"), outline=hex_to_rgb("#1f1914"))
        draw.ellipse([120, 8, 128, 18], fill=hex_to_rgb("#64748b", 160)) # Smoke

        # Charcoal firebox
        draw.rectangle([100, 52, 122, 68], fill=hex_to_rgb("#170c06"))
        draw.rectangle([102, 55, 120, 66], fill=hex_to_rgb("#f97316"))
        draw.rectangle([106, 58, 116, 63], fill=hex_to_rgb("#fef08a"))

        # Anvil & Quench barrel
        draw.rectangle([106, 92, 120, 106], fill=hex_to_rgb("#452a16"))
        draw_bevel_box(draw, 104, 86, 18, 7, hex_to_rgb(PAL_BRONZE[2]), hex_to_rgb(PAL_BRONZE[0]), hex_to_rgb(PAL_BRONZE[4]))
        draw.rectangle([110, 84, 118, 86], fill=hex_to_rgb("#f97316")) # Glowing spearhead

        draw.rectangle([123, 88, 135, 104], fill=hex_to_rgb("#5c3a21"), outline=hex_to_rgb("#1c1917"))
        draw.rectangle([124, 89, 134, 92], fill=hex_to_rgb("#0284c7"))

        # Archery target & practice post
        draw.line([22, 112, 26, 92], fill=hex_to_rgb("#5c3a21"), width=2)
        draw.line([30, 112, 26, 92], fill=hex_to_rgb("#5c3a21"), width=2)
        draw.ellipse([17, 85, 35, 103], fill=hex_to_rgb("#ca8a04"), outline=hex_to_rgb("#78350f"))
        draw.ellipse([21, 89, 31, 99], fill=hex_to_rgb("#dc2626"))
        draw.ellipse([24, 92, 28, 96], fill=hex_to_rgb("#ffffff"))

        # Faction War Banner
        draw.line([51, 4, 51, 16], fill=hex_to_rgb("#5c3a21"), width=2)
        draw.polygon([(52, 4), (66, 8), (52, 12)], fill=hex_to_rgb(team_pal[1]), outline=hex_to_rgb(team_pal[0]))
        img.save(f"public/assets/buildings/bldg_barracks_{owner}.png")

    # 5. Watchtower / Turret (2x2 tiles = 96x96)
    for owner, team_pal in [("player", PAL_TEAM_PLAYER), ("sea_peoples", PAL_TEAM_ENEMY)]:
        img = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        # Drop shadow
        draw.rectangle([16, 22, 80, 92], fill=hex_to_rgb("#000000", 140))
        # Circular foundation apron
        draw.ellipse([20, 68, 76, 92], fill=hex_to_rgb(PAL_CONCRETE[2]), outline=hex_to_rgb(PAL_CONCRETE[4]))

        # Tapered Polygonal Stone Shaft
        draw.polygon([(31, 26), (65, 26), (72, 80), (24, 80)], fill=hex_to_rgb(PAL_CONCRETE[1]), outline=hex_to_rgb("#261f18"))
        # Cyclopean masonry courses
        for ly in range(36, 78, 10):
            ratio = (ly - 26) / 54.0
            lx = int(31 - ratio * 7)
            rx = int(65 + ratio * 7)
            draw.line([lx, ly, rx, ly], fill=hex_to_rgb("#4a3f34"), width=1)

        # Arrow slit embrasures
        for ey in (38, 52, 66):
            draw.rectangle([46, ey, 50, ey + 8], fill=hex_to_rgb("#0f0c08"))
            draw.rectangle([47, ey + 2, 49, ey + 5], fill=hex_to_rgb("#fbbf24"))

        # Heavy studded ground door
        draw_bevel_box(draw, 42, 67, 12, 14, hex_to_rgb("#452a16"), hex_to_rgb("#78350f"), hex_to_rgb("#1c150e"))
        draw.rectangle([44, 71, 46, 73], fill=hex_to_rgb("#fbbf24"))
        draw.rectangle([48, 71, 50, 73], fill=hex_to_rgb("#fbbf24"))

        # Overhanging machicolations / corbels
        for cx in range(27, 68, 8):
            draw.rectangle([cx, 24, cx + 5, 29], fill=hex_to_rgb(PAL_CONCRETE[3]))

        # Battlements slab
        draw_bevel_box(draw, 25, 21, 46, 4, hex_to_rgb(PAL_CONCRETE[1]), hex_to_rgb(PAL_CONCRETE[0]), hex_to_rgb(PAL_CONCRETE[4]))

        # Crenels & Merlons
        for mx in (25, 38, 51, 64):
            draw_bevel_box(draw, mx, 13, 7, 9, hex_to_rgb(PAL_CONCRETE[1]), hex_to_rgb(PAL_CONCRETE[0]), hex_to_rgb(PAL_CONCRETE[3]))

        # Sentry lookout with bronze cap
        draw.rectangle([45, 12, 51, 20], fill=hex_to_rgb(team_pal[1]))
        draw.ellipse([45, 7, 51, 13], fill=hex_to_rgb("#cbd5e1"))
        draw.line([52, 6, 52, 20], fill=hex_to_rgb("#fbbf24"), width=1)

        # Signal fire basket & smoke
        draw.rectangle([28, 4, 30, 16], fill=hex_to_rgb("#1c1917"))
        draw.rectangle([25, 3, 33, 6], fill=hex_to_rgb("#1c1917"))
        draw.ellipse([26, 0, 32, 6], fill=hex_to_rgb("#f97316"))
        draw.ellipse([27, -1, 31, 3], fill=hex_to_rgb("#fef08a"))
        draw.ellipse([24, -8, 32, 0], fill=hex_to_rgb("#64748b", 120))

        # Cedar canopy hood
        roof_c = "#992b1b" if owner == "player" else "#1d4e89"
        roof_hi = "#d94834" if owner == "player" else "#2b6cb0"
        draw_bevel_box(draw, 33, 2, 30, 8, hex_to_rgb(roof_c), hex_to_rgb(roof_hi), hex_to_rgb("#3b100a"))
        img.save(f"public/assets/buildings/bldg_watchtower_{owner}.png")

# ============================================================================
# 3. UNITS (Dune II 1992 Pixel Sprites 32x32)
# ============================================================================
def generate_units():
    os.makedirs("public/assets/units", exist_ok=True)

    # A. Donkey Caravan / Harvester (32x32)
    img = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Ground shadow
    draw.ellipse([4, 22, 28, 28], fill=hex_to_rgb("#000000", 150))
    # Donkey body with black outline
    draw.rectangle([6, 10, 26, 22], fill=hex_to_rgb("#5c4632"), outline=hex_to_rgb("#000000"))
    draw.rectangle([20, 4, 26, 14], fill=hex_to_rgb("#5c4632"), outline=hex_to_rgb("#000000"))
    draw.rectangle([22, 2, 24, 5], fill=hex_to_rgb("#291c12")) # Ears
    # Wicker pannier baskets
    draw_bevel_box(draw, 8, 11, 14, 10, hex_to_rgb(PAL_BRONZE[2]), hex_to_rgb(PAL_BRONZE[0]), hex_to_rgb(PAL_BRONZE[4]))
    # Full cargo green ore indicator
    draw.rectangle([10, 8, 20, 11], fill=hex_to_rgb(PAL_COPPER[1]), outline=hex_to_rgb("#000000"))
    img.save("public/assets/units/unit_harvester.png")

    # B. Tower-Shield Spearman (32x32)
    img = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([8, 22, 24, 28], fill=hex_to_rgb("#000000", 150))
    # Body
    draw.rectangle([12, 10, 20, 22], fill=hex_to_rgb("#f0e8dc"), outline=hex_to_rgb("#000000"))
    draw.rectangle([13, 5, 19, 10], fill=hex_to_rgb("#d49b6a"), outline=hex_to_rgb("#000000")) # Head
    # Tower Shield
    draw_bevel_box(draw, 7, 7, 9, 20, hex_to_rgb(PAL_TEAM_PLAYER[1]), hex_to_rgb(PAL_TEAM_PLAYER[0]), hex_to_rgb(PAL_TEAM_PLAYER[3]))
    draw.rectangle([10, 14, 13, 20], fill=hex_to_rgb(PAL_BRONZE[1]))
    # Spear
    draw.line([20, 8, 20, 26], fill=hex_to_rgb("#38291b"), width=2)
    draw.polygon([(20, 2), (18, 7), (22, 7)], fill=hex_to_rgb(PAL_BRONZE[1]), outline=hex_to_rgb("#000000"))
    img.save("public/assets/units/unit_spearman.png")

    # C. War Chariot / Tank (32x32)
    img = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([2, 20, 30, 28], fill=hex_to_rgb("#000000", 160))
    # Chariot chassis
    draw_bevel_box(draw, 4, 8, 14, 16, hex_to_rgb("#4a331e"), hex_to_rgb("#735133"), hex_to_rgb("#24170c"))
    # Team banner
    draw.rectangle([5, 10, 15, 14], fill=hex_to_rgb(PAL_TEAM_PLAYER[1]))
    # Spoked wheels
    draw.rectangle([7, 5, 15, 7], fill=hex_to_rgb(PAL_BRONZE[1]), outline=hex_to_rgb("#000000"))
    draw.rectangle([7, 24, 15, 26], fill=hex_to_rgb(PAL_BRONZE[1]), outline=hex_to_rgb("#000000"))
    # Two horses
    draw.rectangle([16, 7, 30, 14], fill=hex_to_rgb("#734c29"), outline=hex_to_rgb("#000000"))
    draw.rectangle([16, 17, 30, 24], fill=hex_to_rgb("#734c29"), outline=hex_to_rgb("#000000"))
    img.save("public/assets/units/unit_chariot.png")

    # D. Sea Peoples Raider / Shardana (32x32)
    img = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([8, 22, 24, 28], fill=hex_to_rgb("#000000", 150))
    # Red kilt body
    draw.rectangle([12, 10, 20, 22], fill=hex_to_rgb(PAL_TEAM_ENEMY[2]), outline=hex_to_rgb("#000000"))
    draw.rectangle([13, 5, 19, 10], fill=hex_to_rgb("#d49b6a"), outline=hex_to_rgb("#000000"))
    # Horned Helmet
    draw.line([12, 2, 14, 6], fill=hex_to_rgb(PAL_BRONZE[1]), width=2)
    draw.line([20, 2, 18, 6], fill=hex_to_rgb(PAL_BRONZE[1]), width=2)
    # Round Shield & Sword
    draw.ellipse([6, 10, 16, 20], fill=hex_to_rgb("#421414"), outline=hex_to_rgb("#000000"))
    draw.rectangle([9, 13, 13, 17], fill=hex_to_rgb(PAL_BRONZE[1]))
    draw.line([20, 8, 25, 3], fill=hex_to_rgb(PAL_BRONZE[1]), width=2)
    img.save("public/assets/units/unit_raider.png")

if __name__ == "__main__":
    generate_tiles()
    generate_buildings()
    generate_units()
    print("All Dune II 1992 Pixel Art PNG assets successfully generated!")
