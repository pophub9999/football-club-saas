#!/usr/bin/env python3
import re, urllib.request
from bs4 import BeautifulSoup
URL="https://mapa.torreense.com/mapa"
req=urllib.request.Request(URL,headers={"User-Agent":"Mozilla/5.0","Accept":"text/html,*/*","Accept-Language":"pt-PT,pt;q=0.9"})
with urllib.request.urlopen(req,timeout=30) as r:
    html=r.read().decode("utf-8","ignore")
print("BYTES",len(html))
s=BeautifulSoup(html,"html.parser")
print("TITLE",s.title.get_text(" ",strip=True) if s.title else "")
# print candidate repeated card-like nodes
for tag in s.find_all(["article","li","div"])[:500]:
    txt=" ".join(tag.get_text(" ",strip=True).split())
    if "Abrir no Google Maps" in txt and len(txt)<1200:
        print("CARD_TAG",tag.name,"CLASS",tag.get("class"),"ID",tag.get("id"),"TXT",txt[:700])
        for a in tag.find_all("a",href=True):
            print(" LINK",a.get_text(" ",strip=True),a["href"])
        print("---")
# scripts / endpoints
for sc in s.find_all("script"):
    txt=sc.string or sc.get_text() or ""
    if any(k in txt.lower() for k in ["parceir","partner","supabase","api/","google maps"]):
        print("SCRIPT",re.sub(r"\s+"," ",txt)[:4000])

print("\nOFFICIAL_ADVANTAGES_PAGE")
U2="https://www.torreense.com/socio-vantagens"
req=urllib.request.Request(U2,headers={"User-Agent":"Mozilla/5.0","Accept":"text/html,*/*","Accept-Language":"pt-PT,pt;q=0.9"})
with urllib.request.urlopen(req,timeout=30) as r:
    h2=r.read().decode("utf-8","ignore")
print("OFF_BYTES",len(h2))
s2=BeautifulSoup(h2,"html.parser")
for img in s2.find_all("img"):
    alt=(img.get("alt") or "").strip()
    if alt:
        p=img
        for _ in range(5):
            p=p.parent if p else None
            if not p: break
            txt=" ".join(p.get_text(" ",strip=True).split())
            if ("Desconto" in txt or "Vantagens" in txt or "Oferta" in txt) and len(txt)<900:
                print("OFFCARD","ALT",repr(alt),"TAG",p.name,"CLASS",p.get("class"),"TXT",txt[:700])
                break

for needle in ["Bom Repouso","Footlab"]:
    i=h2.find(needle)
    print("SNIP",needle,i,re.sub(r"\\s+"," ",h2[max(0,i-1200):i+1800]) if i>=0 else "NOT_FOUND")
