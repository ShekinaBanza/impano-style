"""Serveur local avec adresses propres (comme GitHub Pages) :
   /boutique  /boutique/sacs  /produit/<id>  /histoire  /commande  /admin
   Lancer :  python serve.py 5173"""
import http.server, os, sys

PAGES = {"boutique", "produit", "histoire", "commande", "admin"}

class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?")[0].split("#")[0]
        parts = [p for p in path.split("/") if p]
        if parts and parts[0] in PAGES and "." not in parts[0]:
            self.path = "/" + parts[0] + ".html" + (("?" + self.path.split("?", 1)[1]) if "?" in self.path else "")
        return super().do_GET()
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    http.server.ThreadingHTTPServer(("", port), H).serve_forever()
