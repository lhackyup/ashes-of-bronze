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

    # 1. Acropolis / Construction Yard (4x4 tiles = 128x128)
    for owner, team_pal in [("player", PAL_TEAM_PLAYER), ("sea_peoples", PAL_TEAM_ENEMY)]:
        img = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        # Drop shadow
        draw.rectangle([8, 12, 122, 124], fill=hex_to_rgb("#000000", 170))
        # Outer heavy fortress perimeter
        draw_bevel_box(draw, 4, 8, 120, 114, hex_to_rgb(PAL_CONCRETE[2]), hex_to_rgb(PAL_CONCRETE[0]), hex_to_rgb(PAL_CONCRETE[4]))
        # Inner Megaron Citadel
        draw_bevel_box(draw, 16, 20, 96, 90, hex_to_rgb(PAL_CONCRETE[1]), hex_to_rgb(PAL_CONCRETE[0]), hex_to_rgb(PAL_CONCRETE[3]))
        # Terracotta tiled pitched roofs
        draw_bevel_box(draw, 20, 16, 88, 20, hex_to_rgb("#992b1b"), hex_to_rgb("#d94834"), hex_to_rgb("#4d120a"))
        for rx in range(24, 104, 6):
            draw.line([rx, 18, rx, 34], fill=hex_to_rgb("#3b0c06"))

        # Central Command Dome / Visor
        draw_bevel_box(draw, 46, 42, 36, 28, hex_to_rgb("#29221b"), hex_to_rgb("#4a3c2f"), hex_to_rgb("#120d09"))
        draw.rectangle([50, 46, 78, 52], fill=hex_to_rgb(team_pal[1]), outline=hex_to_rgb("#000000"))
        draw.rectangle([56, 56, 72, 64], fill=hex_to_rgb("#ffea00"), outline=hex_to_rgb("#000000"))

        # Heavy motorized blast door (bottom entrance)
        draw_bevel_box(draw, 44, 76, 40, 32, hex_to_rgb("#1c1611"), hex_to_rgb("#382b20"), hex_to_rgb("#0d0a07"))
        # Bronze studs & hazard teeth
        for by in (84, 94):
            for bx in range(48, 82, 8):
                draw.rectangle([bx, by, bx + 2, by + 2], fill=hex_to_rgb(PAL_BRONZE[1]))

        # Fluted Cedar Colonnade (Frontal)
        for cx in (22, 34, 90, 102):
            draw.rectangle([cx, 74, cx + 4, 108], fill=hex_to_rgb("#8c1d18"), outline=hex_to_rgb("#000000"))
            draw.rectangle([cx - 1, 72, cx + 5, 74], fill=hex_to_rgb(PAL_BRONZE[1])) # Capital

        # Radar Flagstaff with animated banner
        draw.line([110, 10, 110, 42], fill=hex_to_rgb("#000000"), width=2)
        draw.polygon([(112, 12), (124, 17), (112, 22)], fill=hex_to_rgb(team_pal[1]), outline=hex_to_rgb("#000000"))
        img.save(f"public/assets/buildings/bldg_acropolis_{owner}.png")

    # 2. Bronze Foundry / Spice Refinery (3x3 tiles = 96x96)
    for owner, team_pal in [("player", PAL_TEAM_PLAYER), ("sea_peoples", PAL_TEAM_ENEMY)]:
        img = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        # Drop shadow
        draw.rectangle([6, 8, 92, 90], fill=hex_to_rgb("#000000", 170))
        # Main hull
        draw_bevel_box(draw, 4, 6, 88, 84, hex_to_rgb(PAL_CONCRETE[2]), hex_to_rgb(PAL_CONCRETE[0]), hex_to_rgb(PAL_CONCRETE[4]))

        # THE ICONIC DUNE II VEHICLE UNLOAD RAMP (Left wing)
        draw_bevel_box(draw, 8, 14, 34, 68, hex_to_rgb("#4a3e33"), hex_to_rgb("#6e5d4d"), hex_to_rgb("#292119"))
        # Hazard caution chevron stripes
        for ry in range(20, 74, 10):
            draw.polygon([(10, ry), (24, ry + 6), (38, ry), (38, ry + 4), (24, ry + 10), (10, ry + 4)], fill=hex_to_rgb("#ffd166"))

        # Ore Intake Hopper & Molten Bronze Vat (Right wing)
        draw_bevel_box(draw, 46, 18, 42, 60, hex_to_rgb("#241c15"), hex_to_rgb("#423427"), hex_to_rgb("#0f0b08"))
        # Molten core glow
        draw.rectangle([52, 26, 82, 50], fill=hex_to_rgb("#ff5500"), outline=hex_to_rgb("#000000"))
        draw.rectangle([56, 30, 78, 46], fill=hex_to_rgb("#ffea00"))
        draw.rectangle([62, 34, 72, 42], fill=hex_to_rgb("#ffffff"))

        # Twin industrial chimneys
        for chx in (50, 72):
            draw_bevel_box(draw, chx, 4, 10, 16, hex_to_rgb("#3d332a"), hex_to_rgb("#5c4d3f"), hex_to_rgb("#1f1914"))
            draw.rectangle([chx + 2, 2, chx + 8, 4], fill=hex_to_rgb("#000000"))

        # Stacked Oxhide Bronze Ingots on pallets
        for iy, ix in [(58, 54), (58, 70), (66, 62)]:
            draw.rectangle([ix, iy, ix + 12, iy + 6], fill=hex_to_rgb(PAL_BRONZE[1]), outline=hex_to_rgb("#000000"))
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

    # 4. Barracks / Infantry Depot (3x3 tiles = 96x96)
    for owner, team_pal in [("player", PAL_TEAM_PLAYER), ("sea_peoples", PAL_TEAM_ENEMY)]:
        img = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.rectangle([6, 8, 92, 90], fill=hex_to_rgb("#000000", 170))
        draw_bevel_box(draw, 4, 6, 88, 84, hex_to_rgb(PAL_CONCRETE[2]), hex_to_rgb(PAL_CONCRETE[0]), hex_to_rgb(PAL_CONCRETE[4]))

        # Slanted roof barracks wings
        draw_bevel_box(draw, 8, 10, 80, 22, hex_to_rgb("#992b1b"), hex_to_rgb("#d94834"), hex_to_rgb("#4d120a"))

        # Internal courtyard (Packed dirt)
        draw.rectangle([12, 36, 84, 82], fill=hex_to_rgb("#8f7149"), outline=hex_to_rgb("#000000"))

        # Sliding armored hangar gate
        draw_bevel_box(draw, 32, 54, 32, 28, hex_to_rgb("#1f1914"), hex_to_rgb("#382e25"), hex_to_rgb("#0d0a08"))
        draw.rectangle([36, 60, 60, 64], fill=hex_to_rgb(team_pal[1])) # Team stripe

        # Weapon racks & shields
        for wx in (16, 72):
            draw.rectangle([wx, 42, wx + 8, 64], fill=hex_to_rgb(PAL_BRONZE[1]), outline=hex_to_rgb("#000000"))
        img.save(f"public/assets/buildings/bldg_barracks_{owner}.png")

    # 5. Watchtower / Turret (2x2 tiles = 64x64)
    for owner, team_pal in [("player", PAL_TEAM_PLAYER), ("sea_peoples", PAL_TEAM_ENEMY)]:
        img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.rectangle([4, 6, 60, 58], fill=hex_to_rgb("#000000", 160))
        # High square turret
        draw_bevel_box(draw, 10, 8, 44, 52, hex_to_rgb(PAL_CONCRETE[1]), hex_to_rgb(PAL_CONCRETE[0]), hex_to_rgb(PAL_CONCRETE[3]))
        # Parapet battlements
        draw_bevel_box(draw, 6, 4, 52, 14, hex_to_rgb(PAL_CONCRETE[2]), hex_to_rgb(PAL_CONCRETE[0]), hex_to_rgb(PAL_CONCRETE[4]))
        draw.rectangle([18, 4, 24, 8], fill=hex_to_rgb("#000000"))
        draw.rectangle([38, 4, 44, 8], fill=hex_to_rgb("#000000"))

        # Arrow slits
        draw.rectangle([24, 24, 28, 38], fill=hex_to_rgb("#000000"))
        draw.rectangle([36, 24, 40, 38], fill=hex_to_rgb("#000000"))

        # Signal beacon / Fire pot
        draw.rectangle([28, 8, 36, 14], fill=hex_to_rgb("#ff5500"), outline=hex_to_rgb("#000000"))
        draw.rectangle([30, 10, 34, 12], fill=hex_to_rgb("#ffea00"))
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
