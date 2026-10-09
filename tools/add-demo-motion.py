"""Add original Gyosoku title and explanatory motion graphic to the demo."""
from pathlib import Path
import math, subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parent.parent
WORK=ROOT/'tmp/demo-edit'; WORK.mkdir(parents=True,exist_ok=True)
FONT=next(Path('/System/Library/Fonts').glob('*角*W6.ttc'))
def f(n):return ImageFont.truetype(str(FONT),n)
def words(d,x,y,txt,size,color='#F5F3EE'):d.text((x,y),txt,font=f(size),fill=color)
logo=Image.open(ROOT/'public/logo.png').convert('RGBA');logo.thumbnail((128,128))

def render(name,duration,draw_frame):
    out=WORK/f'{name}.mp4'
    process=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s','1280x720','-r','24','-i','-',
        '-an','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-threads','2','-movflags','+faststart',str(out)],stdin=subprocess.PIPE)
    for frame in range(duration*24):
        t=frame/24;im=Image.new('RGB',(1280,720),'#082C38');d=ImageDraw.Draw(im)
        for line in range(9):
            pts=[(x,525+line*24+math.sin(x/100+t*.8+line*.3)*14) for x in range(0,1281,8)]
            d.line(pts,fill='#10434C',width=2)
        draw_frame(im,d,t)
        if frame==duration*12:im.save(ROOT/f'artifacts/demo-edit/{name}-preview.jpg')
        process.stdin.write(im.tobytes())
    process.stdin.close()
    if process.wait()!=0:raise RuntimeError('Motion encode failed')
    return out

def title(im,d,t):
    d.rounded_rectangle((64,56,212,205),radius=24,fill='#F5F3EE')
    im.paste(logo,(74,67),logo)
    words(d,230,91,'GYOSOKU / 魚測',42)
    words(d,78,260,'港の記録に、データの力を。',56)
    words(d,80,365,'PORT RECORDS. PUBLIC DATA. HUMAN DECISIONS.',25,'#B5D5D3')
    words(d,80,459,'実際のアプリと、開発の背景。',30)
    words(d,80,513,'A real app walkthrough and the research behind it.',23,'#B5D5D3')
    d.rounded_rectangle((80,623,80+int(1100*min(t/5,1)),629),radius=3,fill='#FF8A4C')

def flow(im,d,t):
    words(d,55,36,'GYOSOKU / HOW THE PIECES CONNECT',22,'#8DCBC2')
    words(d,55,91,'記録・公開データ・AIが、判断を支える。',42)
    words(d,55,160,'Explanatory graphic · people remain in control',24,'#B5D5D3')
    left=[('この端末の記録','Your saved entries',250),('公開の予報API','Public forecast APIs',366),('AIの入力サポート','AI draft assistance',482)]
    for i,(ja,en,y) in enumerate(left):
        d.rounded_rectangle((55,y,450,y+92),radius=18,fill='#124C55',outline='#2D7779',width=2)
        words(d,80,y+12,ja,28);words(d,80,y+55,en,20,'#B5D5D3')
        start=(450,y+46);end=(664,400)
        d.line([start,end],fill='#2D7779',width=3)
        for j in range(3):
            phase=(t*.3+j/3+i*.14)%1
            p=(int(start[0]+(end[0]-start[0])*phase),int(start[1]+(end[1]-start[1])*phase))
            d.ellipse((p[0]-5,p[1]-5,p[0]+5,p[1]+5),fill='#FFAA72')
    d.rounded_rectangle((664,274,940,524),radius=26,fill='#F5F3EE')
    words(d,700,302,'Gyosoku',36,'#0B3A45')
    words(d,700,373,'整理して表示',28,'#14786F')
    words(d,700,439,'Record + context',20,'#516B70')
    d.line([(940,400),(1015,400)],fill='#FFAA72',width=4)
    d.polygon([(1015,400),(1000,389),(1000,411)],fill='#FFAA72')
    words(d,1032,357,'人が判断',28)
    words(d,1032,410,'You decide',21,'#B5D5D3')
    words(d,55,628,'しくみの説明図 / Concept diagram — not a shared-data backend',21,'#B5D5D3')

intro=render('00-custom-title',5,title);diagram=render('06b-custom-flow',8,flow)
names=['01-harbor','02-market','03-dock','04-photo','05-app','06-research','07-research','08-capabilities','09-close']
parts=[intro]+[WORK/f'{n}.mp4' for n in names]
parts.insert(7,diagram)
manifest=WORK/'custom-concat.txt';manifest.write_text(''.join(f"file '{p}'\n" for p in parts))
out=ROOT/'artifacts/demo-edit/gyosoku-app-research-demo-designed.mp4'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(manifest),'-c','copy','-movflags','+faststart',str(out)],check=True)
print(out)
