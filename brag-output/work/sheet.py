import sys, glob
from PIL import Image, ImageDraw
files = sorted(glob.glob(sys.argv[2] if len(sys.argv) > 2 else 'stills/*.png'))
cols = 4; w, h = 480, 270
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + 22)), (40, 40, 40))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    x, y = (i % cols) * w, (i // cols) * (h + 22)
    sheet.paste(im, (x, y + 22))
    d.text((x + 6, y + 5), f.split('/')[-1], fill=(255, 255, 255))
sheet.save(sys.argv[1] if len(sys.argv) > 1 else 'sheet.png')
