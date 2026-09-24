#!/usr/bin/env python3
import re, json, urllib.request, urllib.parse
from bs4 import BeautifulSoup

UA={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36","Accept":"text/html,*/*","Accept-Language":"pt-PT,pt;q=0.9"}
BASE="https://torreense.360imprimir.pt"

def get(u):
    req=urllib.request.Request(u,headers=UA)
    with urllib.request.urlopen(req,timeout=30) as r:
        return r.read().decode("utf-8","ignore")

for path in ["/","/products","/categories/equipamentos","/categories/lifestyle","/categories/gifts-e-acessorios"]:
    url=BASE+path
    try:
        html=get(url)
    except Exception as e:
        print("FETCH_FAIL",url,repr(e));continue
    print("\nPAGE",url,"BYTES",len(html))
    s=BeautifulSoup(html,"html.parser")
    print("TITLE",s.title.get_text(" ",strip=True) if s.title else "")
    prod=[]
    cats=[]
    for a in s.find_all("a",href=True):
        href=urllib.parse.urljoin(BASE,a["href"])
        txt=" ".join(a.get_text(" ",strip=True).split())
        if "/products/" in href:
            if (txt,href) not in prod: prod.append((txt,href))
        if "/categories/" in href:
            if (txt,href) not in cats: cats.append((txt,href))
    print("PRODUCT_LINKS",len(prod))
    for t,u in prod[:20]: print("PRODUCT",repr(t),u)
    print("CATEGORY_LINKS",len(cats))
    for t,u in cats[:30]: print("CATEGORY",repr(t),u)
    print("SCRIPT_SRCS")
    for sc in s.find_all("script",src=True):
        print("SCRIPT",urllib.parse.urljoin(BASE,sc["src"]))
    patterns=[
      r'https?://[^"\'\s<>]+',
      r'["\'](/api/[^"\']+)["\']',
      r'["\']([^"\']*(?:product|catalog|category|checkout|payment)[^"\']*)["\']'
    ]
    for pat in patterns:
        vals=[]
        for m in re.findall(pat,html,re.I):
            if isinstance(m,tuple):m=m[0]
            if m not in vals:vals.append(m)
        for v in vals[:120]:
            if any(x in v.lower() for x in ("api","product","catalog","category","checkout","payment","stripe","mbway","sibs","ifthen","eupago")):
                print("PAT",v[:500])
    # Next/React hydration data
    nd=s.find("script",id="__NEXT_DATA__")
    if nd:
        print("NEXT_DATA",nd.get_text()[:5000])

print("\nINLINE_DATA_SNIPPETS")
html=get(BASE+"/products")
for needle in ["categories:[{","data:{products:[{","products:[{id:"]:
    i=html.find(needle)
    print("NEEDLE",needle,"AT",i)
    if i>=0:
        print(html[max(0,i-500):i+12000])
s=BeautifulSoup(html,"html.parser")
for idx,sc in enumerate(s.find_all("script")):
    body=sc.get_text()
    if body and ("products" in body or "categories" in body):
        print("INLINE_SCRIPT",idx,"type=",sc.get("type"),"len=",len(body))
        print(body[:15000])
