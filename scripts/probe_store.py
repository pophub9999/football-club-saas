#!/usr/bin/env python3
import re,urllib.request
UA={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36","Accept":"text/html,*/*","Accept-Language":"pt-PT,pt;q=0.9"}
u="https://torreense.360imprimir.pt/editor?id=479&type=template"
req=urllib.request.Request(u,headers=UA)
with urllib.request.urlopen(req,timeout=35) as r: html=r.read().decode("utf-8","ignore")
print("BYTES",len(html))
for needle in ["T-shirt Mulher Azul","SIZE_XS","Tamanho","product:{","fields:[","attributes","options","variants","description:"]:
    pos=0
    while True:
        i=html.find(needle,pos)
        if i<0:break
        print("\nNEEDLE",needle,"AT",i)
        print(re.sub(r"\s+"," ",html[max(0,i-1800):i+5500]))
        pos=i+len(needle)
        break
