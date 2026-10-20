"""Lokale testserver die de headers uit firebase.json toepast (zoals Firebase Hosting)."""
import http.server, json, os, re, sys, functools, threading
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
def rx(glob):
    g=re.escape(glob)
    g=re.sub(r'@\\\((.*?)\\\)',lambda m:'('+m.group(1).replace('\\|','|')+')',g)
    g=g.replace(r'\*\*','.*').replace(r'\*','[^/]*')
    return re.compile('^'+g+'$')
class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/__/firebase/init.json'):
            # nabootsing van Firebase Hosting zonder gekoppeld project
            b=b'{}';self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length','2');self.end_headers();self.wfile.write(b);return
        return super().do_GET()
    def end_headers(self):
        cfg=json.load(open(ROOT+'/firebase.json'))['hosting']
        p=self.path.split('?')[0]
        for h in cfg['headers']:
            if rx(h['source']).match(p) or (h['source']=='**'):
                for kv in h['headers']: self.send_header(kv['key'],kv['value'])
        super().end_headers()
    def send_error(self,code,message=None,explain=None):
        if code==404 and os.path.exists(ROOT+'/public/404.html'):
            b=open(ROOT+'/public/404.html','rb').read();self.send_response(404);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b);return
        super().send_error(code,message,explain)
    def log_message(self,*a):pass
H.extensions_map.update({'.webmanifest':'application/manifest+json','.woff':'font/woff','.txt':'text/plain; charset=utf-8','.js':'text/javascript','.json':'application/json'})
def start(port=8765):
    s=http.server.ThreadingHTTPServer(('127.0.0.1',port),functools.partial(H,directory=ROOT+'/public'))
    threading.Thread(target=s.serve_forever,daemon=True).start();return s
if __name__=='__main__':
    start(int(sys.argv[1]) if len(sys.argv)>1 else 8765);print('klaar: server draait',flush=True);threading.Event().wait()
