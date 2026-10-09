"""Reproducible edit of user harbor footage + recorded app + research context."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import subprocess, json, shutil

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / 'tmp/demo-edit'
WORK.mkdir(parents=True, exist_ok=True)
DOWNLOADS = Path('/Users/pablo/Downloads')
FONT = next(Path('/System/Library/Fonts').glob('*角*W6.ttc'))
PAPER = '#F5F3EE'; NAVY = '#0B3A45'; TEAL = '#14786F'; ORANGE = '#FF8A4C'

def font(size): return ImageFont.truetype(str(FONT), size)
def text(draw, xy, lines, size=44, fill=NAVY, spacing=16):
    for i, line in enumerate(lines.split('\n')):
        draw.text((xy[0], xy[1] + i*(size+spacing)), line, font=font(size), fill=fill)
def ff(args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)
def encode(args, name):
    out=WORK / f'{name}.mp4'
    ff([*args, '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-pix_fmt', 'yuv420p', '-r', '24', '-threads', '2', '-movflags', '+faststart', str(out)])
    return out

def lower(name, label, ja, en):
    im=Image.new('RGBA',(1280,720));d=ImageDraw.Draw(im)
    d.rectangle((0,488,1280,720),fill=(5,30,39,235))
    text(d,(48,509),label,20,ORANGE)
    text(d,(48,548),ja,44,'white')
    text(d,(48,620),en,23,'#D8E8E6')
    p=WORK/f'{name}.png';im.save(p);return p

parts=[]
def clip(path, start, duration, name, label, ja, en):
    overlay=lower(name,label,ja,en)
    parts.append(encode(['-ss',str(start),'-t',str(duration),'-i',str(path),'-loop','1','-i',str(overlay),
        '-filter_complex','[0:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1,fps=24[v];[v][1:v]overlay=0:0:shortest=1,fade=t=in:st=0:d=0.35,fade=t=out:st='+str(duration-.35)+':d=0.35', '-t',str(duration)],name))

clip(DOWNLOADS/'WhatsApp Video 2026-10-10 at 07.54.07.mp4',1,6,'01-harbor','GYOSOKU · 気仙沼',
     '港の仕事を、スマホの記録へ。','From harbor work to a simple phone record.')
clip(DOWNLOADS/'WhatsApp Video 2026-10-10 at 07.54.11.mp4',.4,6,'02-market','現場から着想 / THE CONTEXT',
     '魚の種類、量、時間を、わかりやすく。','Make fish, quantity and arrival time easier to understand.')
clip(DOWNLOADS/'WhatsApp Video 2026-10-10 at 07.54.07 (1).mp4',0,2.4,'03-dock','港から、その先へ / FROM THE PORT',
     '毎日の仕事を、次の判断につなぐ。','A record that helps inform the next decision.')

def still(path,duration,name,label,ja,en):
    base=ImageOps.fit(Image.open(path).convert('RGB'),(1280,720));p=WORK/f'{name}-base.jpg';base.save(p,quality=94)
    overlay=lower(name,label,ja,en)
    parts.append(encode(['-loop','1','-i',str(p),'-loop','1','-i',str(overlay),'-filter_complex',
        '[0:v]zoompan=z=min(zoom+0.0003\\,1.045):d=1:s=1280x720:fps=24[v];[v][1:v]overlay=0:0:shortest=1,fade=t=in:st=0:d=0.35,fade=t=out:st='+str(duration-.35)+':d=0.35','-t',str(duration)],name))
still(DOWNLOADS/'WhatsApp Image 2026-10-10 at 07.54.07.jpeg',4,'04-photo','使いやすさを考える / DESIGN CONTEXT',
      '必要な情報を、少ない操作で記録。','A simple workflow designed around essential information.')

# Keep Claude's real app recording. Replace concept captions on its left side.
steps=[(0,8,'1 / はじめる','役割を選んで、\nプロフィールを入力。','Choose your role and enter your profile.'),
       (8,16,'2 / 入力する','魚の種類・量・\n入港予定を入力。','Enter fish, quantity and expected arrival.'),
       (16,21,'3 / 確認して保存','内容を確認して、\nこの端末に保存。','Review the entry and save it on this device.'),
       (21,29,'4 / 集計を見る','自分の入力を、\nグラフで振り返る。','Review your own entries in charts.'),
       (29,35,'5 / 海況を見る','天気と波の予報を、\n出典とともに確認。','Check forecasts with their data sources.')]
filters=['[0:v]fps=24,setsar=1[base]'];inputs=[]
for i,(start,end,tag,ja,en) in enumerate(steps):
    im=Image.new('RGB',(724,720),PAPER);d=ImageDraw.Draw(im)
    text(d,(52,45),'Gyosoku 魚測',31)
    text(d,(52,151),tag,24,TEAL)
    text(d,(52,217),ja,46,spacing=20)
    # Wrap English deliberately for the 724px panel.
    en_lines={'Choose your role and enter your profile.':'Choose your role\nand enter your profile.',
      'Enter fish, quantity and expected arrival.':'Enter fish, quantity\nand expected arrival.',
      'Review the entry and save it on this device.':'Review the entry and\nsave it on this device.',
      'Review your own entries in charts.':'Review your own entries\nin charts.',
      'Check forecasts with their data sources.':'Check forecasts with\ntheir data sources.'}[en]
    text(d,(52,390),en_lines,25,'#516B70',12)
    text(d,(52,572),'実際のアプリ画面 · 入力例',21,TEAL)
    text(d,(52,612),'Recorded app · example entries',20,'#516B70')
    p=WORK/f'app-caption-{i}.png';im.save(p);inputs.extend(['-loop','1','-i',str(p)])
    prev='base' if i==0 else f'v{i-1}'
    filters.append(f'[{prev}][{i+1}:v]overlay=0:0:enable=\'gte(t,{start})*lt(t,{end})\'[v{i}]')
parts.append(encode(['-i',str(ROOT/'artifacts/demo-edit/app-walkthrough-original.mp4'),*inputs,
    '-filter_complex',';'.join(filters),'-map','[v4]','-t','35'],'05-app'))

def card(name,duration,heading,subtitle,rows,footer):
    im=Image.new('RGB',(1280,720),PAPER);d=ImageDraw.Draw(im)
    text(d,(54,36),'GYOSOKU / BEHIND THE APP',22,TEAL)
    text(d,(54,95),heading,44)
    text(d,(54,160),subtitle,23,'#516B70')
    for i,(title,detail) in enumerate(rows):
        y=235+i*108
        d.rounded_rectangle((50,y,1230,y+91),radius=18,fill='white')
        d.ellipse((75,y+27,107,y+59),fill=TEAL)
        text(d,(134,y+14),title,29)
        text(d,(134,y+55),detail,20,'#516B70')
    text(d,(54,633),footer,20,TEAL)
    p=WORK/f'{name}.png';im.save(p)
    parts.append(encode(['-loop','1','-i',str(p),'-vf',f'fade=t=in:st=0:d=0.4,fade=t=out:st={duration-.4}:d=0.4','-t',str(duration)],name))

card('06-research',9,'オンラインの予報を、アプリへ。','Real online data · identified sources and forecast times',[
    ('Open-Meteo / DWD','風・雨・波の予報 / Wind, rain and wave forecasts'),
    ('Open-Meteo / Météo-France','沖合の水温・海流 / Offshore temperature and currents'),
    ('気象庁 JMA','宮城県の公式予報・警報ページ / Official forecast and warning links')],
    '予報は漁獲量の予測ではありません。 / Weather context is not a catch prediction.')
card('07-research',8,'情報の意味まで、確かめる。','Research, data checks and honest limits',[
    ('出典・時刻・単位を確認','Sources, forecast times and units checked before display'),
    ('データがないときは「取得できません」','Missing values stay unavailable; they are not replaced with zero'),
    ('日本語と英語、スマホの操作を検討','Bilingual copy reviewed; real fishermen usability testing is still needed')],
    '詳細な調査記録はプロジェクト内に保存。 / Source research documented in the project.')
card('08-capabilities',8,'記録・集計・予報を、ひとつに。','Working features today · what comes next',[
    ('魚の見込みを入力・保存・編集','Record, save and edit expected catches on your device'),
    ('自分の入力を集計し、海況を確認','Review your entries and check online ocean/weather context'),
    ('魚測AIが入力と使い方をサポート','AI helps with drafts and guidance; people review and save')],
    '人同士の共有は次の段階。 / Shared multi-user data is the next stage.')
still(DOWNLOADS/'WhatsApp Image 2026-10-10 at 07.54.07 (1).jpeg',6,'09-close','GYOSOKU · 魚測',
      'まずは、魚の見込みを入力してみる。','Try it: gyosoku.netlify.app/fisherman/')

concat=WORK/'concat.txt';concat.write_text(''.join(f"file '{p}'\n" for p in parts))
out=ROOT/'artifacts/demo-edit/gyosoku-app-research-demo.mp4'
ff(['-f','concat','-safe','0','-i',str(concat),'-c','copy','-movflags','+faststart',str(out)])
ff(['-ss','2','-i',str(out),'-frames:v','1',str(ROOT/'artifacts/demo-edit/gyosoku-demo-poster.jpg')])
print('Ready:',out)
