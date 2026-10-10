"""Create a review-only continuous-usage edition; never overwrite public video."""
from pathlib import Path
import subprocess,json
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parent.parent
W=R/'tmp/human-splice';W.mkdir(parents=True,exist_ok=True)
A=R/'artifacts/demo-edit/human-usage';A.mkdir(parents=True,exist_ok=True)
def ff(args):subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y',*args],check=True)
font=next(Path('/System/Library/Fonts').glob('*角*W6.ttc'))
steps=[(0,12.5,'1 / 入力する','魚の種類・量・\n入港予定を入力。','Enter fish, quantity\nand expected arrival.'),(12.5,28.2,'2 / 確認して保存','内容を確認して、\nデモに保存。','Review and save\nin the demo.'),(28.2,47.8,'3 / 集計・海況を見る','入力をグラフで確認。\n海況も、出典とともに。','Review entries and\ncheck forecast sources.')]
inputs=[];filters=['[0:v]scale=310:672,setsar=1,fps=24[phone]']
for i,(start,end,tag,ja,en) in enumerate(steps):
 im=Image.new('RGB',(1280,720),'#F5F3EE');d=ImageDraw.Draw(im)
 for x,y,s,size,color in [(52,45,'Gyosoku 魚測',31,'#0B3A45'),(52,151,tag,24,'#14786F'),(52,217,ja,44,'#0B3A45'),(52,390,en,25,'#516B70'),(52,572,'実際の操作 · サンプルデータ',23,'#14786F'),(52,614,'Continuous app capture · sample data',20,'#516B70')]:d.multiline_text((x,y),s,font=ImageFont.truetype(str(font),size),fill=color,spacing=16)
 d.rounded_rectangle((850,12,1188,708),radius=28,fill='#152A3C')
 p=W/f'caption-{i}.png';im.save(p);inputs+=['-loop','1','-i',str(p)]
filters+=['[1:v][phone]overlay=864:24[base]']
for i in range(1,3):
 prev='base' if i==1 else 'v1';start,end=steps[i][:2]
 # Caption panels overlay only the left side; phone capture remains continuous.
 filters.append(f'[{i+1}:v]crop=800:720:0:0[c{i}]')
 filters.append(f'[{prev}][c{i}]overlay=0:0:enable=\'gte(t,{start})*lt(t,{end})\'[v{i}]')
app=W/'05-human-app.mp4'
ff(['-i',str(R/'artifacts/human-demo/gyosoku-human-usage-raw-phone.mp4'),*inputs,'-filter_complex',';'.join(filters),'-map','[v2]','-t','47.8','-an','-c:v','libx264','-crf','22','-preset','fast','-pix_fmt','yuv420p','-threads','2','-r','24','-video_track_timescale','12288',str(app)])
names=['00-custom-title','01-harbor','02-market','03-dock','04-photo',None,'06-research','06b-custom-flow','07-research','08-capabilities','09-close']
parts=[app if n is None else R/f'tmp/demo-edit/{n}.mp4' for n in names]
manifest=W/'concat.txt';manifest.write_text(''.join(f"file '{p}'\n" for p in parts))
silent=W/'silent.mp4';ff(['-f','concat','-safe','0','-i',str(manifest),'-c','copy',str(silent)])
# Reuse scene-aligned existing Japanese narration; remove onboarding speech.
source=R/'tmp/demo-narration/narration.wav'
ff(['-i',str(source),'-filter_complex','[0:a]atrim=0:23.4,asetpts=PTS-STARTPTS[a];[0:a]atrim=31.4:58.4,asetpts=PTS-STARTPTS,apad,atrim=duration=47.8[b];[0:a]atrim=58.4,asetpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=0:a=1[out]','-map','[out]',str(W/'audio.wav')])
out=A/'gyosoku-human-usage-edit-ja.mp4'
ff(['-i',str(silent),'-i',str(W/'audio.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','128k','-movflags','+faststart','-shortest',str(out)])
marks=[0,5,11,17,19.4,23.4,35.9,51.6,71.2,80.2,88.2,96.2,104.2]
for i,t in enumerate(marks):ff(['-ss',str(t+.3),'-i',str(out),'-frames:v','1',str(A/f'scene-{i:02}.jpg')])
thumbs=[]
for p in sorted(A.glob('scene-*.jpg')):
 im=Image.open(p);im.thumbnail((384,216));thumbs.append(im.copy())
sheet=Image.new('RGB',(384*3,240*5),'white');d=ImageDraw.Draw(sheet)
for i,im in enumerate(thumbs):x=i%3*384;y=i//3*240;sheet.paste(im,(x,y));d.text((x+5,y+217),str(marks[i]),fill='black')
sheet.save(A/'contact-sheet.jpg')
(A/'scenes.json').write_text(json.dumps({'sceneStarts':marks,'appSegment':[23.4,71.2],'appCaptionMarks':[23.4,35.9,51.6],'note':'Review-only. Sample data; existing narration reused without onboarding.'},indent=2)+'\n')
print(out)
