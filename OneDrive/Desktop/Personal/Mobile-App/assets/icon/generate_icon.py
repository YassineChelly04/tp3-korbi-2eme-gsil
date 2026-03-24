from PIL import Image, ImageDraw
import math

# Create a 512x512 icon with orange/red gradient
size = 512
img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Draw gradient background circle
for i in range(size):
    # Calculate gradient color (orange to red)
    ratio = i / size
    r = int(255 * (1 - ratio * 0.15))
    g = int(107 - ratio * 107)
    b = int(53 - ratio * 53)
    color = (r, g, b, 255)
    
    # Draw circle layer
    radius = size // 2 - i // 2
    if radius > 0:
        draw.ellipse([i//2, i//2, size-i//2, size-i//2], fill=color)

# Draw document shape in center (white rounded rectangle)
doc_margin = size // 4
doc_radius = 40
draw.rounded_rectangle(
    [doc_margin, doc_margin, size - doc_margin, size - doc_margin],
    radius=doc_radius,
    fill=(255, 255, 255, 255)
)

# Add scan lines (3 horizontal lines)
line_color = (255, 87, 34, 200)
line_width = 12
line_margin = doc_margin + 60
line_spacing = (size - 2 * line_margin) // 4

for i in range(3):
    y = line_margin + line_spacing * (i + 1)
    draw.rectangle(
        [doc_margin + 40, y - line_width//2, size - doc_margin - 40, y + line_width//2],
        fill=line_color
    )

# Save the icon
img.save('app_icon.png')
print("Icon created: app_icon.png")

# Create foreground for adaptive icon (document only)
img_fg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw_fg = ImageDraw.Draw(img_fg)

# Draw white document
fg_margin = size // 6
draw_fg.rounded_rectangle(
    [fg_margin, fg_margin, size - fg_margin, size - fg_margin],
    radius=50,
    fill=(255, 255, 255, 255)
)

# Add scan lines
for i in range(3):
    y_offset = size // 4 + (size // 8) * i
    draw_fg.rectangle(
        [fg_margin + 60, y_offset - 10, size - fg_margin - 60, y_offset + 10],
        fill=(255, 87, 34, 255)
    )

img_fg.save('app_icon_foreground.png')
print("Foreground icon created: app_icon_foreground.png")
