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
    found={}
    empty_pages=0
    for page in range(1,21):
        url="https://www.torreense.com/blog?page="+str(page)
        try:
            doc=get(url).replace("\\/","/")
            print("BLOG_HTTP_OK",url,"bytes",len(doc))
        except Exception as e:
            print("BLOG_FETCH_FAILED",url,repr(e))
            empty_pages+=1
            if empty_pages>=2: break
            continue

        links=[]
        # The site emits normal hrefs, but not necessarily with a leading slash.
        for pat in [
            r"""href\s*=\s*["']([^"']*blog/[^"'?#]+)""",
            r'https?://(?:www\.)?torreense\.com/blog/[A-Za-z0-9_-]+',
            r"""["']((?:https?://(?:www\.)?torreense\.com)?/?blog/[A-Za-z0-9_-]+)["']""",
        ]:
            links.extend(re.findall(pat,doc,re.I))

        before=len(found)
        for href in links:
            u=urllib.parse.urljoin("https://www.torreense.com/",href).rstrip("/")
            if re.match(r'https://(?:www\.)?torreense\.com/blog/[A-Za-z0-9_-]+$',u,re.I):
                found[u]=True

        added=len(found)-before
        print("PAGE_DISCOVERED",page,added,"TOTAL",len(found))
        empty_pages = empty_pages + 1 if added==0 else 0
        if page>=7 and empty_pages>=2:
            break

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

    # Prefer the article/main content instead of the whole page. Keep its HTML
    # so the app can retain paragraphs, headings, lists and inline images.
    art=re.search(r"<article\\b[\\s\\S]*?</article>",doc,re.I)
    if not art: art=re.search(r"<main\\b[\\s\\S]*?</main>",doc,re.I)
    section=art.group(0) if art else doc
    section=re.sub(r"<script[\\s\\S]*?</script>|<style[\\s\\S]*?</style>|<nav[\\s\\S]*?</nav>|<footer[\\s\\S]*?</footer>","",section,flags=re.I)
    text=clean(section)

    category="FUTEBOL" if re.search(r">\\s*Futebol\\s*<",section,re.I) else ("CLUBE" if re.search(r">\\s*Clube\\s*<",section,re.I) else "TORREENSE")
    published=None
    # Prefer explicit metadata, then visible Portuguese date.
    dm=re.search(r'<meta[^>]+(?:property|name)=["\'](?:article:published_time|datePublished)["\'][^>]+content=["\']([^"\']+)',doc,re.I)
    if dm:
        try: published=datetime.fromisoformat(dm.group(1).replace("Z","+00:00")).isoformat()
        except: pass
    if not published:
        months={"janeiro":1,"fevereiro":2,"março":3,"abril":4,"maio":5,"junho":6,"julho":7,"agosto":8,"setembro":9,"outubro":10,"novembro":11,"dezembro":12}
        dm=re.search(r"\\b(\\d{1,2})\\s+de\\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\\s+de\\s+(20\\d{2})\\b",text,re.I)
        if dm:
            published=datetime(int(dm.group(3)),months[dm.group(2).lower()],int(dm.group(1)),12,tzinfo=timezone.utc).isoformat()

    return {"source":"torreense","url":url,"slug":url.rstrip("/").split("/")[-1],"title":title or url.rstrip("/").split("/")[-1],"category":category,"published_at":published,"excerpt":text[:300],"hero_image_url":img or None,"content_text":text[:30000],"content_html":section[:150000],"active":True,"updated_at":datetime.now(timezone.utc).isoformat()}

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
