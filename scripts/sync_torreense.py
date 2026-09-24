#!/usr/bin/env python3
import os,re,json,html as h,urllib.request,urllib.parse,subprocess,sys
from datetime import datetime,timezone
try:
    from bs4 import BeautifulSoup
except ModuleNotFoundError:
    subprocess.check_call([sys.executable,"-m","pip","install","beautifulsoup4","-q"])
    from bs4 import BeautifulSoup

BASE=os.environ["SUPABASE_URL"].rstrip("/")
KEY=os.environ["SUPABASE_SERVICE_ROLE_KEY"]
TEST_NEWS_LIMIT=1  # temporário enquanto validamos o parser
HEAD={"apikey":KEY,"Authorization":"Bearer "+KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=minimal"}
UA={
 "User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
 "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
 "Accept-Language":"pt-PT,pt;q=0.9,en;q=0.7",
 "Cache-Control":"no-cache"
}
_IMAGE_OK={}

def image_ok(url):
    if not url:return False
    if url in _IMAGE_OK:return _IMAGE_OK[url]
    try:
        req=urllib.request.Request(url,headers={**UA,"Range":"bytes=0-0"})
        with urllib.request.urlopen(req,timeout=8) as r:
            status=getattr(r,"status",200)
            ctype=(r.headers.get("Content-Type") or "").lower()
            ok=200 <= status < 400 and ctype.startswith("image/")
    except Exception:
        ok=False
    _IMAGE_OK[url]=ok
    return ok

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
    soup=BeautifulSoup(doc,"html.parser")

    def meta_value(key):
        tag=soup.find("meta",attrs={"property":key}) or soup.find("meta",attrs={"name":key})
        return h.unescape(tag.get("content","")).strip() if tag else ""

    title=meta_value("og:title")
    if not title and soup.title:
        title=soup.title.get_text(" ",strip=True)
    title=re.sub(r"\s*\|\s*(?:Site Oficial do )?Torreense\s*$","",title,flags=re.I).strip()
    meta_img=meta_value("og:image") or None

    def normalise_image(src):
        if not src:return None
        src=h.unescape(src).strip()
        if not src or src.startswith("data:") or src.startswith("blob:"):return None
        if src.startswith("//"):src="https:"+src
        elif not re.match(r"^https?://",src,re.I):
            src=urllib.parse.urljoin("https://www.torreense.com/",src.lstrip("/"))
        # Torreense currently emits a broken featured-image URL on article pages.
        if re.search(r"/blog/images/news/featured/",src,re.I):
            return None
        return src

    def node_image(node):
        candidates=[
            node.get("data-src"),node.get("data-lazy-src"),node.get("data-original"),
            node.get("data-image"),node.get("src")
        ]
        pic=node.find_parent("picture")
        if pic:
            for source in pic.find_all("source"):
                ss=source.get("data-srcset") or source.get("srcset")
                if ss:
                    vals=[x.strip().split(" ")[0] for x in ss.split(",") if x.strip()]
                    if vals:candidates.insert(0,vals[-1])
        ss=node.get("data-srcset") or node.get("srcset")
        if ss:
            vals=[x.strip().split(" ")[0] for x in ss.split(",") if x.strip()]
            if vals:candidates.insert(0,vals[-1])
        for candidate in candidates:
            src=normalise_image(candidate)
            if not src:
                continue
            # Article media hosted under /source/ is the canonical content media.
            if "/source/" in src.lower():
                return src
            if image_ok(src):
                return src
        return None

    # Find the visible article H1. This is the stable boundary we care about.
    h1=None
    for node in soup.find_all("h1"):
        txt=node.get_text(" ",strip=True)
        if title and (txt.casefold()==title.casefold() or title.casefold() in txt.casefold() or txt.casefold() in title.casefold()):
            h1=node
            break
    if h1 is None:
        h1=soup.find("h1")
    if h1 is None:
        print("ARTICLE_CONTENT_NOT_FOUND",url,"NO_H1")
        return None

    # Metadata immediately before the article.
    published=None
    category="TORREENSE"
    previous_text=[]
    for node in h1.find_all_previous(["p","span","div","time"],limit=40):
        txt=node.get_text(" ",strip=True)
        if txt:
            previous_text.append(txt)
    context=" ".join(reversed(previous_text))

    dm=re.search(r"\b(\d{1,2})\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(20\d{2})\b",context,re.I)
    if dm:
        months={"janeiro":1,"fevereiro":2,"março":3,"abril":4,"maio":5,"junho":6,"julho":7,"agosto":8,"setembro":9,"outubro":10,"novembro":11,"dezembro":12}
        published=datetime(int(dm.group(3)),months[dm.group(2).lower()],int(dm.group(1)),12,tzinfo=timezone.utc).isoformat()

    # Pick the nearest category label before H1.
    for txt in reversed(previous_text):
        if txt.strip().casefold()=="futebol":
            category="FUTEBOL"; break
        if txt.strip().casefold()=="clube":
            category="CLUBE"; break

    blocks=[]
    text_parts=[]
    seen=set()
    text_started=False

    # Walk semantic elements AFTER the title and STOP at the related-news heading.
    for node in h1.find_all_next(["h1","h2","h3","p","li","img"]):
        if node is h1:
            continue

        if node.name in ("h1","h2","h3"):
            txt=node.get_text(" ",strip=True)
            if re.fullmatch(r"Últimas\s+Notícias",txt,re.I):
                break

        # Ignore anything living in obvious page chrome/widgets.
        bad_parent=False
        for parent in node.parents:
            if getattr(parent,"name",None) in ("nav","header","footer","form"):
                bad_parent=True; break
            cls=" ".join(parent.get("class",[]) if hasattr(parent,"get") else [])
            ident=(parent.get("id","") if hasattr(parent,"get") else "")
            if re.search(r"(share|social|related|latest|newsletter|footer|header|menu)",cls+" "+ident,re.I):
                bad_parent=True; break
        if bad_parent:
            continue

        if node.name=="img":
            src=node_image(node)
            alt=(node.get("alt") or "").strip()
            if src and text_started and not re.search(r"(logo|icon|sprite|avatar|facebook|twitter|linkedin|youtube|instagram)",src+" "+alt,re.I):
                key=("img",src)
                if key not in seen:
                    seen.add(key)
                    blocks.append('<img src="'+h.escape(src,quote=True)+'">')
            continue

        txt=node.get_text(" ",strip=True)
        if not txt:
            continue
        if re.fullmatch(r"(?:Partilhar\s+notícia:?|Partilhar:?|Ver\s+todas|Facebook|X|Twitter|LinkedIn)",txt,re.I):
            continue
        if txt==title:
            continue

        # Nested semantic tags can repeat the exact same text; keep one copy only.
        key=(node.name,txt)
        if key in seen:
            continue
        seen.add(key)

        tag=node.name if node.name in ("h2","h3","p","li") else "p"
        blocks.append("<"+tag+">"+h.escape(txt)+"</"+tag+">")
        text_parts.append(txt)
        text_started=True

    text=" ".join(text_parts).strip()
    if len(text)<40:
        print("ARTICLE_CONTENT_NOT_FOUND",url,"EMPTY_AFTER_H1")
        return None

    content_html="".join(blocks) if blocks else "<p>"+h.escape(text)+"</p>"
    # Keep article media in its original position; no synthetic hero image.
    hero=None

    return {
        "source":"torreense",
        "url":url,
        "slug":url.rstrip("/").split("/")[-1],
        "title":title or url.rstrip("/").split("/")[-1],
        "category":category,
        "published_at":published,
        "excerpt":text[:300],
        "hero_image_url":hero,
        "content_text":text[:30000],
        "content_html":content_html[:150000],
        "active":True,
        "updated_at":datetime.now(timezone.utc).isoformat()
    }

def main():
    urls=discover_news()
    rows=[]
    for u in urls[:TEST_NEWS_LIMIT]:
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
