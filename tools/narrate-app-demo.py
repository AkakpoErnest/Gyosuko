"""Japanese narration, scene-aligned; original video remains intact."""
from pathlib import Path
import subprocess, json

ROOT=Path(__file__).resolve().parent.parent
WORK=ROOT/'tmp/demo-narration';WORK.mkdir(parents=True,exist_ok=True)
SCENES=[
 (0,5,'港の記録に、データの力を。'),
 (5,6,'気仙沼の港の仕事から、アプリの使い方を考えました。'),
 (11,6,'魚の種類、量、入港の時間。必要な情報を、わかりやすく記録します。'),
 (17,2.4,'港から、その先へ。'),
 (19.4,4,'毎日の記録が、次の判断を支えます。'),
 (23.4,8,'まず、役割を選びます。名前や母港などのプロフィールを入力して、はじめます。'),
 (31.4,8,'魚の種類と、おおよその量、入港予定を入力します。まだ見込みの段階でも、記録できます。'),
 (39.4,5,'内容を確認したら、保存します。記録は、この端末に残ります。'),
 (44.4,8,'入力した見込みを、グラフで確認できます。魚の種類ごとの量や、入力の状況を振り返ります。'),
 (52.4,6,'海況の画面では、天気や波の予報を、出典とともに確認します。'),
 (58.4,9,'オンラインの予報も使っています。オープンメテオや気象庁などの情報です。これは、漁獲量を予測するものではありません。'),
 (67.4,8,'自分の記録、公開データ、AIの入力サポートを、わかりやすく整理します。最後の判断は、人が行います。'),
 (75.4,8,'開発では、出典、時刻、単位を調べました。データがないときは、ゼロで埋めず、取得できないことを伝えます。'),
 (83.4,8,'記録、集計、予報を、ひとつに。AIが入力を手伝います。人と人のデータ共有は、これからの段階です。'),
 (91.4,6,'まずは、魚の見込みを入力してみてください。現場でのご意見を、お待ちしています。'),
]

def probe(path):
 return float(json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_entries','format=duration','-of','json',str(path)]))['format']['duration'])
clips=[];evidence=[]
for i,(start,slot,words) in enumerate(SCENES):
 script=WORK/f'{i:02}.txt';script.write_text(words)
 audio=WORK/f'{i:02}.aiff'
 subprocess.run(['say','-v','Kyoko','-r','180','-f',str(script),'-o',str(audio)],check=True)
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
(ROOT/'artifacts/demo-edit/narration-ja.json').write_text(json.dumps({'voice':'macOS Kyoko (Japanese)','rate':180,'scenes':evidence},ensure_ascii=False,indent=2)+'\n')
print(out)
