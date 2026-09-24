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

    def meta_value(key):
        for tag in re.findall(r"<meta\\b[^>]*>",doc,re.I):
            if re.search(r"(?:property|name)=[\"']"+re.escape(key)+r"[\"']",tag,re.I):
                m=re.search(r"content=[\"']([^\"']*)[\"']",tag,re.I)
                if m:return h.unescape(m.group(1)).strip()
        return ""

    title=meta_value("og:title")
    if not title:
        m=re.search(r"<title>(.*?)</title>",doc,re.I|re.S)
        title=clean(m.group(1)) if m else ""
    title=re.sub(r"\\s*\\|\\s*(?:Site Oficial do )?Torreense\\s*$","",title,flags=re.I).strip()
    img=meta_value("og:image")

    body=re.sub(r"<script[\\s\\S]*?</script>|<style[\\s\\S]*?</style>|<nav[\\s\\S]*?</nav>|<footer[\\s\\S]*?</footer>|<header[\\s\\S]*?</header>|<form[\\s\\S]*?</form>"," ",doc,flags=re.I)
    visible=clean(body)

    low=visible.lower()
    t=title.lower().strip()
    p=low.rfind(t) if t else -1
    if p<0:
        print("ARTICLE_CONTENT_NOT_FOUND",url)
        return None

    start=p+len(title)
    q=low.find("últimas notícias",start)
    rawtxt=visible[start:q if q>start else None].strip()

    # Remove page controls that sit between title and body.
    rawtxt=re.sub(r"^.*?Partilhar\\s+notícia:\\s*","",rawtxt,flags=re.I|re.S)
    rawtxt=re.sub(r"^(?:Facebook|X|Twitter|LinkedIn)\\b[:\\s•|-]*","",rawtxt,flags=re.I)
    rawtxt=re.sub(r"\\s+Ver\\s+todas\\s*$","",rawtxt,flags=re.I)

    if len(rawtxt)<40:
        print("ARTICLE_CONTENT_NOT_FOUND",url)
        return None

    # Reconstruct paragraphs from common sentence boundaries so the app does not
    # render one giant block while we avoid importing related-news/footer content.
    parts=[x.strip() for x in re.split(r"(?<=[.!?])\\s+(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])",rawtxt) if x.strip()]
    content_html="".join("<p>"+h.escape(x)+"</p>" for x in parts) if parts else "<p>"+h.escape(rawtxt)+"</p>"

    category="TORREENSE"
    if re.search(r"\\bFutebol\\b",visible,re.I): category="FUTEBOL"
    elif re.search(r"\\bClube\\b",visible,re.I): category="CLUBE"

    published=None
    dm=re.search(r"\\b(\\d{1,2})\\s+de\\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\\s+de\\s+(20\\d{2})\\b",visible,re.I)
    if dm:
        months={"janeiro":1,"fevereiro":2,"março":3,"abril":4,"maio":5,"junho":6,"julho":7,"agosto":8,"setembro":9,"outubro":10,"novembro":11,"dezembro":12}
        published=datetime(int(dm.group(3)),months[dm.group(2).lower()],int(dm.group(1)),12,tzinfo=timezone.utc).isoformat()

    return {"source":"torreense","url":url,"slug":url.rstrip("/").split("/")[-1],"title":title or url.rstrip("/").split("/")[-1],"category":category,"published_at":published,"excerpt":rawtxt[:300],"hero_image_url":img or None,"content_text":rawtxt[:30000],"content_html":content_html[:150000],"active":True,"updated_at":datetime.now(timezone.utc).isoformat()}

def main():
    urls=discover_news()
    rows=[]
    for u in urls:
        try:
            item=article(u)
            if item: rows.append(item)
        except Exception as e:print("article failed",u,e)
    if not rows:
        raise RuntimeError("No Torreense news discovered/imported; failing sync instead of reporting false success")
    # Replace the Torreense snapshot atomically from the app's point of view:
    # remove previous Torreense rows, then insert the freshly extracted set.
    # This avoids duplicate rows even if historical records were created before
    # URL upsert/conflict handling was reliable.
    delete_headers={"apikey":KEY,"Authorization":"Bearer "+KEY,"Content-Type":"application/json","Prefer":"return=minimal"}
    api("news?source=eq.torreense","DELETE",headers=delete_headers)
    insert_headers={"apikey":KEY,"Authorization":"Bearer "+KEY,"Content-Type":"application/json","Prefer":"return=minimal"}
    api("news","POST",rows,headers=insert_headers)
    now=datetime.now(timezone.utc).isoformat()
    status={"source":"torreense_news","last_sync":now,"last_success":now,"status":"success","message":"Official Torreense news sync","items_processed":len(rows),"updated_at":now}
    api("sync_status?on_conflict=source","POST",[status])
    api("app_sync?id=eq.1","PATCH",{"version":int(datetime.now().timestamp()),"updated_at":now})
    print("Synced",len(rows),"news items")

if __name__=="__main__":main()
