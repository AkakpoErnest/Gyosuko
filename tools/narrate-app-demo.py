"""Japanese narration, scene-aligned; original video remains intact."""
from pathlib import Path
import subprocess, json

ROOT=Path(__file__).resolve().parent.parent
WORK=ROOT/'tmp/demo-narration';WORK.mkdir(parents=True,exist_ok=True)
SCENES=[
 (0,5,'魚の情報を、もっとわかりやすく。'),
 (5,6,'気仙沼の漁業の現場で使えるアプリを目指しています。'),
 (11,6,'どんな魚が、どのくらい、いつ港に入るのか。スマホで記録できます。'),
 (17,2.4,'使い方を見てみましょう。'),
 (19.4,4,'操作は、スマホでかんたんにできます。'),
 (23.4,8,'まず、自分に合った役割を選びます。名前や、ふだん使う港を入力したら、準備はできあがりです。'),
 (31.4,8,'魚の種類と、だいたいの量、港に着く予定を入力します。まだ量が決まっていなくても、大丈夫です。'),
 (39.4,5,'内容を確認して、保存します。このスマホに記録が残ります。'),
 (44.4,8,'自分が入力した量を、グラフで見ることもできます。どの魚をどれだけ入力したか、ひと目でわかります。'),
 (52.4,6,'天気や波の予報も見られます。情報の提供元も確認できます。'),
 (58.4,9,'気象庁などの公開情報を使っています。天気や波の予報で、魚がどれだけ獲れるかの予測ではありません。'),
 (67.4,8,'自分の記録と、天気や海の情報をまとめて確認できます。AIが入力を手伝いますが、最後は自分で確認します。'),
 (75.4,8,'情報がどこから来たのか、いつの情報か、量の単位は何か。そうした点を調べながら、開発を進めています。'),
 (83.4,8,'今は、自分の記録をこのスマホで見る仕組みです。ほかの人と記録を共有する機能は、これから作っていきます。'),
 (91.4,6,'ぜひ一度、使ってみてください。使いにくいところや、ご要望を聞かせてください。'),
]

def probe(path):
 return float(json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_entries','format=duration','-of','json',str(path)]))['format']['duration'])
clips=[];evidence=[]
for i,(start,slot,words) in enumerate(SCENES):
 script=WORK/f'{i:02}.txt';script.write_text(words)
 audio=WORK/f'{i:02}.aiff'
 subprocess.run(['say','-v','Kyoko','-r','175','-f',str(script),'-o',str(audio)],check=True)
 duration=probe(audio);budget=slot-.3;speed=max(1,duration/budget)
 # A hard bound keeps scene fitting from producing rushed narration.
 if speed>1.28:raise RuntimeError(f'Shorten scene{i}: {duration:.2f}s speech for {slot}s slot')
 clips.append(audio);evidence.append({'start':start,'slot':slot,'text':words,'originalSeconds':duration,'tempo':speed})

inputs=[];filters=[]
for i,(audio,(start,slot,_),item) in enumerate(zip(clips,SCENES,evidence)):
 inputs.extend(['-i',str(audio)])
 filters.append(f'[{i}:a]atempo={item["tempo"]:.5f},aformat=sample_rates=48000:channel_layouts=mono,adelay={int((start+.12)*1000)}:all=1[a{i}]')
filters.append(''.join(f'[a{i}]' for i in range(len(clips)))+f'amix=inputs={len(clips)}:normalize=0,apad,atrim=duration=97.416667,loudnorm=I=-16:TP=-1.5:LRA=11[out]')
wav=WORK/'narration.wav'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y',*inputs,'-filter_complex',';'.join(filters),'-map','[out]','-ar','48000',str(wav)],check=True)
out=ROOT/'artifacts/demo-edit/gyosoku-demo-narrated-ja.mp4'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(ROOT/'artifacts/demo-edit/gyosoku-app-research-demo-designed.mp4'),'-i',str(wav),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','128k','-movflags','+faststart','-t','97.416667',str(out)],check=True)
(ROOT/'artifacts/demo-edit/narration-ja.json').write_text(json.dumps({'voice':'macOS Kyoko (Japanese)','rate':175,'scenes':evidence},ensure_ascii=False,indent=2)+'\n')
print(out)
