from PIL import Image, ImageDraw, ImageFont
import os

# 1. Generate 512x512 Icon
icon = Image.open('apps/mobile/assets/icon.png').convert("RGBA")
icon_512 = icon.resize((512, 512), Image.Resampling.LANCZOS)
# Create a white background just in case Play Store doesn't like transparency for icons
bg_512 = Image.new("RGB", (512, 512), (255, 255, 255))
bg_512.paste(icon_512, mask=icon_512)
bg_512.save('playstore_assets/playstore_icon.png', 'PNG')

# 2. Generate 1024x500 Feature Graphic
# Let's create a beautiful gradient background
feature = Image.new("RGB", (1024, 500))
draw = ImageDraw.Draw(feature)

# Draw a blue diagonal gradient
for y in range(500):
    for x in range(1024):
        # Blend from #0F2027 to #203A43 to #2C5364
        r = int(15 + (x/1024)*29)
        g = int(32 + (y/500)*51)
        b = int(39 + (x/1024)*61)
        draw.point((x, y), fill=(r, g, b))

# Paste the icon in the center
icon_256 = icon.resize((256, 256), Image.Resampling.LANCZOS)
feature.paste(icon_256, ((1024-256)//2, (500-256)//2), mask=icon_256)

feature.save('playstore_assets/playstore_feature_graphic.png', 'PNG')

print("Play Store assets generated successfully!")
