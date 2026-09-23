#!/usr/bin/env python3
import os,re,json,html as h,urllib.request,urllib.parse
from datetime import datetime,timezone

BASE=os.environ["SUPABASE_URL"].rstrip("/")
KEY=os.environ["SUPABASE_SERVICE_ROLE_KEY"]
HEAD={"apikey":KEY,"Authorization":"Bearer "+KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=minimal"}
UA={
 "User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
 "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
 "Accept-Language":"pt-PT,pt;q=0.9,en;q=0.7",
 "Cache-Control":"no-cache"
}

def get(url):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=25) as r:return r.read().decode("utf-8","ignore")

def api(path,method="GET",data=None,headers=None):
    body=None if data is None else json.dumps(data,ensure_ascii=False).encode()
    req=urllib.request.Request(BASE+"/rest/v1/"+path,data=body,method=method,headers=headers or HEAD)
    with urllib.request.urlopen(req,timeout=25) as r:return r.read().decode()

def clean(s):
    s=re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>"," ",s,flags=re.I)
    s=re.sub(r"<[^>]+>"," ",s)
    return re.sub(r"\s+"," ",h.unescape(s)).strip()

def discover_news():
    # The official site exposes the current archive at /blog. Try several
    # representations because some hosts return a JS shell to datacenter IPs.
    candidates=[
        "https://www.torreense.com/blog",
        "https://torreense.com/blog",
    ]
    found={}
    for url in candidates:
        try:
            doc=get(url)
            print("BLOG_HTTP_OK",url,"bytes",len(doc))
        except Exception as e:
            print("BLOG_FETCH_FAILED",url,repr(e))
            continue

        # absolute, relative, href and JSON-escaped URLs
        doc=doc.replace("\\/","/")
        patterns=[
            r'href\\s*=\\s*["\\']([^"\\']*?/blog/[^"\\'?#]+)',
            r'https?://(?:www\\.)?torreense\\.com/blog/[A-Za-z0-9_-]+',
            r'["\\'](/blog/[A-Za-z0-9_-]+)["\\']',
        ]
        for pat in patterns:
            for href in re.findall(pat,doc,re.I):
                u=urllib.parse.urljoin("https://www.torreense.com",href)
                if re.match(r'https://(?:www\\.)?torreense\\.com/blog/[A-Za-z0-9_-]+/?$',u,re.I):
                    found[u.rstrip("/")]=True

    # Stable official article URLs are used only as bootstrap seeds. Once the
    # archive is readable, discovery remains fully automatic.
    seeds=[
      "https://www.torreense.com/blog/estreialigaeuropa",
      "https://www.torreense.com/blog/informacaobileticaligaeuropa",
      "https://www.torreense.com/blog/jogadoresinscritos",
      "https://www.torreense.com/blog/torrespasseuropa",
      "https://www.torreense.com/blog/torrespass",
      "https://www.torreense.com/blog/arrranque",
      "https://www.torreense.com/blog/assembleiagreal",
    ]
    for u in seeds: found[u]=True
    print("DISCOVERED_URLS",len(found))
    return list(found)

def article(url):
    doc=get(url)
    title=""
    m=re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)',doc,re.I)
    if not m:m=re.search(r"<title>(.*?)</title>",doc,re.I|re.S)
    if m:title=clean(m.group(1)).replace(" | Torreense","")
    img=""
    m=re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)',doc,re.I)
    if m:img=h.unescape(m.group(1))
    art=re.search(r"<article[\s\S]*?</article>",doc,re.I)
    section=art.group(0) if art else doc
    text=clean(section)
    category="FUTEBOL" if re.search(r"futebol",doc,re.I) else ("CLUBE" if re.search(r"clube",doc,re.I) else "TORREENSE")
    dates=re.findall(r"\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b",text)
    published=None
    if dates:
        d,mn,y=dates[0]
        try:published=datetime(int(y),int(mn),int(d),12,tzinfo=timezone.utc).isoformat()
        except:pass
    return {"source":"torreense","url":url,"slug":url.rstrip("/").split("/")[-1],"title":title or url.rstrip("/").split("/")[-1],"category":category,"published_at":published,"excerpt":text[:300],"hero_image_url":img or None,"content_text":text[:30000],"content_html":section[:100000],"active":True,"updated_at":datetime.now(timezone.utc).isoformat()}

def main():
    urls=discover_news()
    rows=[]
    for u in urls:
        try:rows.append(article(u))
        except Exception as e:print("article failed",u,e)
    if not rows:
        raise RuntimeError("No Torreense news discovered/imported; failing sync instead of reporting false success")
    api("news?on_conflict=url","POST",rows)
    now=datetime.now(timezone.utc).isoformat()
    status={"source":"torreense_news","last_sync":now,"last_success":now,"status":"success","message":"Official Torreense news sync","items_processed":len(rows),"updated_at":now}
    api("sync_status?on_conflict=source","POST",[status])
    api("app_sync?id=eq.1","PATCH",{"version":int(datetime.now().timestamp()),"updated_at":now})
    print("Synced",len(rows),"news items")

if __name__=="__main__":main()
