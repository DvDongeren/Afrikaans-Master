import subprocess, sys, socket, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import serve
s=socket.socket()
if s.connect_ex(('127.0.0.1',8765))!=0: serve.start(8765)
s.close()
ok=True
for t in (sys.argv[1:] or 't_new t_dlg t_gram t_vv t_ext t_feat t_swipe t_cloud t_sw t_media'.split()):
    r=subprocess.run([sys.executable,t+'.py'],capture_output=True,text=True,timeout=600)
    last=(r.stdout.strip().splitlines() or [''])[-1]
    good=r.returncode==0 and last.endswith('[]') or last.endswith('[] [] []')
    ok&=good; print(('OK   ' if good else 'FOUT ')+t+'  '+last[:200])
    if not good: print(r.stdout[-1500:],r.stderr[-1500:])
print('ALLES GOED' if ok else 'ER ZIJN FOUTEN')
sys.exit(0 if ok else 1)
