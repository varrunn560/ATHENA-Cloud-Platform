from pathlib import Path
from pdf2image import convert_from_path, pdfinfo_from_path
from PIL import Image, ImageOps, ImageDraw
import json

out=Path(__file__).resolve().parent/'qa'
pdf=out/'Athena_DA3_Final_Report.pdf'
poppler=r'C:\Users\varse\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin'
out.mkdir(exist_ok=True)
info=pdfinfo_from_path(str(pdf),poppler_path=poppler)
count=info['Pages']
for page in range(1,count+1):
    imgs=convert_from_path(str(pdf),dpi=130,first_page=page,last_page=page,poppler_path=poppler)
    imgs[0].save(out/f'page-{page}.png')
    print('Rendered page',page,flush=True)
thumbs=[]
for i in range(1,count+1):
    with Image.open(out/f'page-{i}.png') as im:
        im.thumbnail((330,470)); tile=Image.new('RGB',(350,505),'#e3e7eb'); tile.paste(im,((350-im.width)//2,20)); ImageDraw.Draw(tile).text((12,485),f'Page {i}',fill='black'); thumbs.append(tile)
for k in range(0,len(thumbs),12):
    chunk=thumbs[k:k+12]; sheet=Image.new('RGB',(350*4,505*((len(chunk)+3)//4)),'white')
    for j,im in enumerate(chunk): sheet.paste(im,((j%4)*350,(j//4)*505))
    sheet.save(out/f'contact-sheet-{k//12+1}.png')
(out/'render_summary.json').write_text(json.dumps({'pages':count,'engine':'Microsoft Word 16 PDF export with bundled Poppler rasterization','dpi':130},indent=2))
print('Rendered and indexed',count,'pages')
