#!/usr/bin/env python3
import re,urllib.request,urllib.parse
from bs4 import BeautifulSoup
UA={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36","Accept":"text/html,*/*","Accept-Language":"pt-PT,pt;q=0.9"}
BASE="https://www.torreense.com/loja/"

def get(u):
    req=urllib.request.Request(u,headers=UA)
    with urllib.request.urlopen(req,timeout=30) as r:
        return r.read().decode("utf-8","ignore")

html=get(BASE)
print("ROOT_BYTES",len(html))
s=BeautifulSoup(html,"html.parser")
print("TITLE",s.title.get_text(" ",strip=True) if s.title else "")
cats=[]
for a in s.find_all("a",href=True):
    href=urllib.parse.urljoin(BASE,a["href"])
    txt=a.get_text(" ",strip=True)
    if "route=product/category" in href and txt:
        cats.append((txt,href))
seen=[]
for x in cats:
    if x not in seen: seen.append(x)
print("CATEGORIES",len(seen))
for t,u in seen[:100]: print("CAT",repr(t),u)

product_links=[]
for a in s.find_all("a",href=True):
    href=urllib.parse.urljoin(BASE,a["href"])
    if "route=product/product" in href:
        product_links.append((a.get_text(" ",strip=True),href))
uniq=[]
for x in product_links:
    if x not in uniq: uniq.append(x)
print("ROOT_PRODUCTS",len(uniq))
for t,u in uniq[:50]: print("ROOT_PRODUCT",repr(t),u)

# Probe known category and first product.
caturl="https://www.torreense.com/loja/index.php?path=271011943&route=product%2Fcategory"
ch=get(caturl); cs=BeautifulSoup(ch,"html.parser")
links=[]
for a in cs.find_all("a",href=True):
    href=urllib.parse.urljoin(BASE,a["href"])
    if "route=product/product" in href:
        text=a.get_text(" ",strip=True)
        if (text,href) not in links: links.append((text,href))
print("CATEGORY_PRODUCTS",len(links))
for t,u in links[:20]: print("PRODUCT",repr(t),u)
if links:
    ph=get(links[0][1]); ps=BeautifulSoup(ph,"html.parser")
    print("PRODUCT_TITLE",ps.find("h1").get_text(" ",strip=True) if ps.find("h1") else "")
    for img in ps.find_all("img",src=True)[:30]:
        print("IMG",img.get("alt"),urllib.parse.urljoin(BASE,img["src"]))
    for sel in ps.find_all("select"):
        print("SELECT",sel.get("name"),sel.get("id"),[(o.get("value"),o.get_text(" ",strip=True)) for o in sel.find_all("option")])
    for inp in ps.find_all("input"):
        if inp.get("name") or inp.get("type") in ("radio","checkbox"):
            print("INPUT",inp.get("type"),inp.get("name"),inp.get("value"))

print("ALL_PATH_LINKS")
allp=[]
for a in s.find_all("a",href=True):
    href=urllib.parse.urljoin(BASE,a["href"])
    if "path=" in href:
        x=(a.get_text(" ",strip=True),href)
        if x not in allp: allp.append(x)
for t,u in allp[:200]: print("PATHLINK",repr(t),u)
for m in sorted(set(re.findall(r'path(?:=|%3D)([0-9_]+)',html,re.I))):
    print("PATHID",m)
