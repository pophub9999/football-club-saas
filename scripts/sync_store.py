#!/usr/bin/env python3
import os,re,json,html as h,urllib.request,urllib.parse,urllib.error,subprocess,sys
from datetime import datetime,timezone
try:
    from bs4 import BeautifulSoup
except ModuleNotFoundError:
    subprocess.check_call([sys.executable,"-m","pip","install","beautifulsoup4","-q"])
    from bs4 import BeautifulSoup

BASE=os.environ["SUPABASE_URL"].rstrip("/")
KEY=os.environ["SUPABASE_SERVICE_ROLE_KEY"]
STORE="https://www.torreense.com/loja/"
UA={
 "User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
 "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
 "Accept-Language":"pt-PT,pt;q=0.9,en;q=0.7",
 "Cache-Control":"no-cache"
}
HEAD={"apikey":KEY,"Authorization":"Bearer "+KEY,"Content-Type":"application/json"}
CATEGORIES=[
 ("equipment-25-26","EQUIPAMENTO 25/26","https://www.torreense.com/loja/index.php?path=271011943&route=product%2Fcategory"),
 ("accessories","ACESSÓRIOS","https://www.torreense.com/loja/index.php?path=271011657&route=product%2Fcategory"),
]

def get(url):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=35) as r:
        return r.read().decode("utf-8","ignore")

def api(path,method="GET",data=None,prefer=None):
    body=None if data is None else json.dumps(data,ensure_ascii=False).encode()
    headers=dict(HEAD)
    if prefer:headers["Prefer"]=prefer
    req=urllib.request.Request(BASE+"/rest/v1/"+path,data=body,method=method,headers=headers)
    with urllib.request.urlopen(req,timeout=30) as r:
        txt=r.read().decode()
        return json.loads(txt) if txt else None

def ensure_bucket():
    payload=json.dumps({"id":"store","name":"store","public":True}).encode()
    req=urllib.request.Request(BASE+"/storage/v1/bucket",data=payload,method="POST",
        headers={"Authorization":"Bearer "+KEY,"apikey":KEY,"Content-Type":"application/json"})
    try:
        with urllib.request.urlopen(req,timeout=20):pass
    except urllib.error.HTTPError as e:
        if e.code not in (400,409):raise

def cache_image(remote_url,obj):
    ensure_bucket()
    req=urllib.request.Request(remote_url,headers=UA)
    with urllib.request.urlopen(req,timeout=30) as r:
        data=r.read()
        ctype=(r.headers.get("Content-Type") or "application/octet-stream").split(";")[0]
    if not ctype.startswith("image/"):return remote_url
    enc="/".join(urllib.parse.quote(x,safe="") for x in obj.split("/"))
    up=urllib.request.Request(BASE+"/storage/v1/object/store/"+enc,data=data,method="POST",
        headers={"Authorization":"Bearer "+KEY,"apikey":KEY,"Content-Type":ctype,"x-upsert":"true"})
    with urllib.request.urlopen(up,timeout=30):pass
    return BASE+"/storage/v1/object/public/store/"+enc

def slugify(s):
    s=(s or "").lower()
    s=re.sub(r"[^a-z0-9]+","-",s)
    return s.strip("-")

def money(text):
    if not text:return None
    m=re.search(r"(\d+(?:[. ]\d{3})*[,.]\d{2})\s*€",text)
    if not m:return None
    v=m.group(1).replace(" ","").replace(".","").replace(",",".")
    try:return float(v)
    except:return None

def product_id(url):
    q=urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
    return (q.get("product_id") or [""])[0]

def image_candidates(soup,name):
    out=[]
    for img in soup.find_all("img"):
        alt=(img.get("alt") or "").strip()
        if alt.casefold()!=name.casefold():continue
        vals=[]
        for a in ("data-src","data-lazy-src","data-original","src"):
            if img.get(a):vals.append(img.get(a))
        for src in vals:
            src=h.unescape(src).strip()
            if not src or src.startswith("data:"):continue
            src=urllib.parse.urljoin(STORE,src)
            if "logo" in src.lower():continue
            if src not in out:out.append(src)
    out.sort(key=lambda u:(bool(re.search(r"-\d+x\d+[a-z]?\.",u,re.I)),len(u)))
    return out

def option_label(el):
    p=el
    for _ in range(5):
        p=p.parent if p else None
        if not p:break
        txt=p.get_text(" ",strip=True)
        if 0<len(txt)<120:
            m=re.search(r"(Tamanho|Cor|Size|Color|Nome|Número|Numero)",txt,re.I)
            if m:return m.group(1)
    return "Opção"

def parse_options(soup):
    groups={}
    for sel in soup.find_all("select"):
        name=sel.get("name") or ""
        if "option[" not in name:continue
        vals=[]
        for o in sel.find_all("option"):
            text=o.get_text(" ",strip=True)
            val=o.get("value")
            if val and text and "selec" not in text.lower():
                vals.append({"value":val,"label":text})
        if vals:groups[name]={"name":option_label(sel),"field":name,"values":vals,"required":True}
    for inp in soup.find_all("input"):
        typ=(inp.get("type") or "").lower()
        name=inp.get("name") or ""
        if typ not in ("radio","checkbox") or "option[" not in name:continue
        lab=inp.find_parent("label")
        text=lab.get_text(" ",strip=True) if lab else (inp.get("value") or "")
        if not text:continue
        g=groups.setdefault(name,{"name":option_label(inp),"field":name,"values":[],"required":True})
        item={"value":inp.get("value") or text,"label":text}
        if item not in g["values"]:g["values"].append(item)
    # Some Journal/OpenCart themes render options as custom buttons but keep values in data attributes.
    for el in soup.find_all(attrs={"data-option-value":True}):
        val=str(el.get("data-option-value"))
        text=el.get_text(" ",strip=True) or str(el.get("title") or val)
        field=str(el.get("data-option-id") or "option")
        g=groups.setdefault(field,{"name":option_label(el),"field":field,"values":[],"required":True})
        item={"value":val,"label":text}
        if item not in g["values"]:g["values"].append(item)
    return list(groups.values())

def parse_product(url,category_id):
    doc=get(url)
    soup=BeautifulSoup(doc,"html.parser")
    title=soup.find("h1")
    name=title.get_text(" ",strip=True) if title else ""
    pid=product_id(url)
    if not name or not pid:return None

    text=soup.get_text(" ",strip=True)
    price=None
    meta=soup.find("meta",attrs={"property":"product:price:amount"}) or soup.find(attrs={"itemprop":"price"})
    if meta:
        raw=meta.get("content") or meta.get("value") or meta.get_text(" ",strip=True)
        try:price=float(str(raw).replace(",","."))
        except:price=None
    if price is None:price=money(text)

    sm=re.search(r"Stock:\s*([^\n\r]+?)(?=\s{2,}|\s[A-ZÁÉÍÓÚ][a-záéíóú]|\d+[,.]\d{2}\s*€|$)",text,re.I)
    stock=(sm.group(1).strip() if sm else "")
    in_stock=None
    if stock:
        low=stock.lower()
        in_stock=not ("fora" in low or "out of stock" in low or "esgot" in low)

    desc=""
    for selector in (".product-description",".description","#tab-description",".tab-content"):
        node=soup.select_one(selector)
        if node:
            cand=node.get_text("\n",strip=True)
            if len(cand)>len(desc):desc=cand

    imgs=image_candidates(soup,name)
    cached=[]
    for i,src in enumerate(imgs[:8]):
        try:
            ext=os.path.splitext(urllib.parse.urlparse(src).path)[1].lower()
            if ext not in (".png",".jpg",".jpeg",".webp",".gif"):ext=".jpg"
            cached.append(cache_image(src,"products/"+pid+"/"+str(i+1)+ext))
        except Exception as e:
            print("STORE_IMAGE_FAILED",pid,src,repr(e))
    options=parse_options(soup)

    return {
      "source":"torreense_store","source_id":pid,"category_id":category_id,
      "name":name,"slug":slugify(name),"url":url,"sku":None,
      "description_text":desc[:12000] if desc else None,
      "price":price,"currency":"EUR","stock_status":stock or None,"in_stock":in_stock,
      "image_url":cached[0] if cached else (imgs[0] if imgs else None),
      "images":cached or imgs[:8],"options":options,"active":True,
      "raw_data":{"official_url":url,"product_id":pid},
      "updated_at":datetime.now(timezone.utc).isoformat()
    }

def upsert_category(source_id,name,url,sort_order):
    payload={"source":"torreense_store","source_id":source_id,"name":name,"url":url,"sort_order":sort_order,"active":True,"updated_at":datetime.now(timezone.utc).isoformat()}
    rows=api("store_categories?select=id&source=eq.torreense_store&source_id=eq."+urllib.parse.quote(source_id,safe="")+"&limit=1") or []
    if rows:
        api("store_categories?id=eq."+str(rows[0]["id"]),"PATCH",payload)
        return rows[0]["id"]
    h2=dict(HEAD);h2["Prefer"]="return=representation"
    out=api("store_categories","POST",payload,"return=representation")
    # helper above cannot pass headers; query inserted row instead
    rows=api("store_categories?select=id&source=eq.torreense_store&source_id=eq."+urllib.parse.quote(source_id,safe="")+"&limit=1") or []
    return rows[0]["id"]

def category_products(url):
    found=[]
    for page in range(1,8):
        sep="&" if "?" in url else "?"
        u=url+sep+"limit=100&page="+str(page)
        soup=BeautifulSoup(get(u),"html.parser")
        batch=[]
        for a in soup.find_all("a",href=True):
            href=urllib.parse.urljoin(STORE,a["href"])
            if "route=product/product" not in href or "product_id=" not in href:continue
            pid=product_id(href)
            if not pid:continue
            # canonical URL without category path; easier stable unique key
            clean=STORE+"index.php?route=product/product&product_id="+pid
            if clean not in batch:batch.append(clean)
        new=[x for x in batch if x not in found]
        found.extend(new)
        if not new:break
    return found

def main():
    all_seen=set()
    total=0
    for idx,(sid,name,url) in enumerate(CATEGORIES,1):
        cid=upsert_category(sid,name,url,idx)
        links=category_products(url)
        print("STORE_CATEGORY",name,len(links))
        for link in links:
            try:
                item=parse_product(link,cid)
                if not item:continue
                all_seen.add(item["source_id"])
                # Upsert via unique source+source_id.
                api("store_products?on_conflict=source,source_id","POST",[item],"resolution=merge-duplicates,return=minimal")
                total+=1
                print("STORE_PRODUCT",item["source_id"],item["name"],item["price"],item["stock_status"],"OPTIONS",len(item["options"]))
            except Exception as e:
                print("STORE_PRODUCT_FAILED",link,repr(e))
    if not all_seen:
        raise RuntimeError("No Torreense store products imported")
    # Only deactivate products from categories we actively synchronize.
    active_cids=[str(x["id"]) for x in (api("store_categories?select=id&source=eq.torreense_store&active=eq.true") or [])]
    if active_cids:
        api("store_products?source=eq.torreense_store&category_id=in.("+",".join(active_cids)+")","PATCH",{"active":False,"updated_at":datetime.now(timezone.utc).isoformat()})
        for pid in all_seen:
            api("store_products?source=eq.torreense_store&source_id=eq."+urllib.parse.quote(pid,safe=""),"PATCH",{"active":True})
    now=datetime.now(timezone.utc).isoformat()
    status={"source":"torreense_store","last_sync":now,"last_success":now,"status":"success","message":"Official Torreense store sync","items_processed":total,"updated_at":now}
    api("sync_status?on_conflict=source","POST",[status],"resolution=merge-duplicates,return=minimal")
    api("app_sync?id=eq.1","PATCH",{"version":int(datetime.now().timestamp()),"updated_at":now})
    print("STORE_SYNCED",total)

if __name__=="__main__":
    main()
