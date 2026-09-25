#!/usr/bin/env python3
import os,re,json,html as h,urllib.request,urllib.parse,urllib.error,subprocess,sys,unicodedata
from datetime import datetime,timezone
try:
    from bs4 import BeautifulSoup
except ModuleNotFoundError:
    subprocess.check_call([sys.executable,"-m","pip","install","beautifulsoup4","-q"])
    from bs4 import BeautifulSoup

BASE=os.environ["SUPABASE_URL"].rstrip("/")
KEY=os.environ["SUPABASE_SERVICE_ROLE_KEY"]
TEST_NEWS_LIMIT=0
TEST_NEWS_URL=""
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

def ensure_news_bucket():
    payload=json.dumps({"id":"news","name":"news","public":True}).encode()
    req=urllib.request.Request(
        BASE+"/storage/v1/bucket",
        data=payload,
        method="POST",
        headers={"Authorization":"Bearer "+KEY,"apikey":KEY,"Content-Type":"application/json"}
    )
    try:
        with urllib.request.urlopen(req,timeout=20):
            pass
    except urllib.error.HTTPError as e:
        # 400/409 normally means the bucket already exists.
        if e.code not in (400,409):
            raise

def cache_image(remote_url,object_path):
    ensure_news_bucket()
    req=urllib.request.Request(remote_url,headers=UA)
    with urllib.request.urlopen(req,timeout=25) as r:
        data=r.read()
        ctype=(r.headers.get("Content-Type") or "application/octet-stream").split(";")[0]
    if not ctype.startswith("image/"):
        raise RuntimeError("Not an image: "+remote_url+" -> "+ctype)

    encoded="/".join(urllib.parse.quote(x,safe="") for x in object_path.split("/"))
    up=urllib.request.Request(
        BASE+"/storage/v1/object/news/"+encoded,
        data=data,
        method="POST",
        headers={
            "Authorization":"Bearer "+KEY,
            "apikey":KEY,
            "Content-Type":ctype,
            "x-upsert":"true"
        }
    )
    try:
        with urllib.request.urlopen(up,timeout=25):
            pass
    except urllib.error.HTTPError as e:
        detail=e.read().decode("utf-8","ignore")
        raise RuntimeError("Storage upload failed "+str(e.code)+" "+detail)

    return BASE+"/storage/v1/object/public/news/"+encoded

def get(url):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=25) as r:return r.read().decode("utf-8","ignore")

def api(path,method="GET",data=None,headers=None):
    body=None if data is None else json.dumps(data,ensure_ascii=False).encode()
    req=urllib.request.Request(BASE+"/rest/v1/"+path,data=body,method=method,headers=headers or HEAD)
    with urllib.request.urlopen(req,timeout=25) as r:return r.read().decode()

def print_cache_schema():
    try:
        req=urllib.request.Request(
            BASE+"/rest/v1/",
            headers={
                "apikey":KEY,
                "Authorization":"Bearer "+KEY,
                "Accept":"application/openapi+json"
            }
        )
        with urllib.request.urlopen(req,timeout=25) as r:
            doc=json.load(r)
        defs=doc.get("definitions",{})
        for name in ("sports","teams","competitions","matches","players","standings"):
            d=defs.get(name,{})
            props=d.get("properties",{})
            print("CACHE_SCHEMA",name,",".join(sorted(props.keys())))
            print("CACHE_REQUIRED",name,",".join(d.get("required",[])))
    except Exception as e:
        print("CACHE_SCHEMA_FAILED",repr(e))

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

def existing_article(url):
    # Safety net: if Torreense temporarily returns only a JS shell, preserve
    # the last clean version already stored in Supabase instead of deleting it.
    try:
        q="news?select=title,category,published_at,excerpt,hero_image_url,content_text,content_html,url,slug&url=eq."+urllib.parse.quote(url,safe="")
        rows=json.loads(api(q))
    except Exception as e:
        print("EXISTING_ARTICLE_READ_FAILED",url,repr(e))
        return None
    if not rows:
        return None
    row=rows[0]
    now=datetime.now(timezone.utc).isoformat()
    return {
        "source":"torreense",
        "url":url,
        "slug":row.get("slug") or url.rstrip("/").split("/")[-1],
        "title":row.get("title") or url.rstrip("/").split("/")[-1],
        "category":row.get("category") or "TORREENSE",
        "published_at":row.get("published_at"),
        "excerpt":row.get("excerpt") or "",
        "hero_image_url":row.get("hero_image_url"),
        "content_text":row.get("content_text") or "",
        "content_html":row.get("content_html") or "",
        "active":True,
        "updated_at":now
    }

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
        item=existing_article(url)
        if item:
            print("ARTICLE_FALLBACK_EXISTING_ROW",url)
            return item
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

    # Walk EVERY element after H1. Torreense sometimes stores article images
    # in link/data attributes instead of a normal <img src>, so inspect all nodes.
    for node in h1.find_all_next(True):
        if node is h1:
            continue

        if node.name in ("h1","h2","h3"):
            txt=node.get_text(" ",strip=True)
            if re.fullmatch(r"Últimas\s+Notícias",txt,re.I):
                break

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

        # Detect article images even when the CMS puts the real file in href,
        # data-srcset, data-image, etc. This catches Torreense /source/... media.
        media_candidates=[]
        if hasattr(node,"get"):
            for attr in ("src","data-src","data-lazy-src","data-original","data-image","href","srcset","data-srcset"):
                value=node.get(attr)
                if not value:
                    continue
                vals=[x.strip().split(" ")[0] for x in value.split(",")] if "srcset" in attr else [value]
                media_candidates.extend(vals)

        media_added=False
        for candidate in media_candidates:
            src=normalise_image(candidate)
            if not src:
                continue
            pathpart=urllib.parse.urlparse(src).path.lower()
            if not ("/source/" in pathpart or re.search(r"\.(?:png|jpe?g|webp|gif)$",pathpart,re.I)):
                continue
            if re.search(r"(logo|icon|sprite|avatar|facebook|twitter|linkedin|youtube|instagram)",src,re.I):
                continue
            key=("img",src)
            if key in seen:
                continue

            # Images can legitimately appear immediately after the title and
            # before the first paragraph. Store them in our own CDN and keep
            # them in the same position as the official article.
            try:
                ext=os.path.splitext(urllib.parse.urlparse(src).path)[1].lower()
                if ext not in (".png",".jpg",".jpeg",".webp",".gif"):
                    ext=".jpg"
                slug=url.rstrip("/").split("/")[-1]
                img_no=sum(1 for b in blocks if b.startswith("<img "))
                cached=cache_image(src,"torreense/"+slug+"/inline-"+str(img_no+1)+ext)
            except Exception as e:
                print("IMAGE_CACHE_FAILED",url,src,repr(e))
                cached=src if image_ok(src) else None

            if cached:
                seen.add(key)
                blocks.append('<img src="'+h.escape(cached,quote=True)+'">')
                media_added=True

        if node.name in ("img","picture","source") or media_added:
            continue

        if node.name not in ("h2","h3","p","li"):
            continue

        txt=node.get_text(" ",strip=True)
        if not txt:
            continue
        if re.fullmatch(r"(?:Partilhar\s+notícia:?|Partilhar:?|Ver\s+todas|Facebook|X|Twitter|LinkedIn)",txt,re.I):
            continue
        if txt==title:
            continue

        key=(node.name,txt)
        if key in seen:
            continue
        seen.add(key)

        tag=node.name
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

def page_image_url(img):
    if img is None:
        return None
    candidates=[]
    for attr in ("data-src","data-lazy-src","data-original","data-image","src"):
        v=img.get(attr)
        if v:
            candidates.append(v)
    for attr in ("data-srcset","srcset"):
        ss=img.get(attr)
        if ss:
            vals=[x.strip().split(" ")[0] for x in ss.split(",") if x.strip()]
            if vals:
                candidates=vals[::-1]+candidates
    pic=img.find_parent("picture")
    if pic:
        for source in pic.find_all("source"):
            ss=source.get("data-srcset") or source.get("srcset")
            if ss:
                vals=[x.strip().split(" ")[0] for x in ss.split(",") if x.strip()]
                if vals:
                    candidates=vals[::-1]+candidates
    for src in candidates:
        src=h.unescape(str(src)).strip()
        if not src or src.startswith(("data:","blob:")):
            continue
        if src.startswith("//"):
            src="https:"+src
        elif not re.match(r"^https?://",src,re.I):
            src=urllib.parse.urljoin("https://www.torreense.com/",src.lstrip("/"))
        return src
    return None

def normalize_person_name(value):
    s=unicodedata.normalize("NFKD",(value or "").casefold())
    s="".join(ch for ch in s if not unicodedata.combining(ch))
    s=re.sub(r"[^a-z0-9]+"," ",s)
    return " ".join(s.split())

def safe_asset_name(value):
    s=normalize_person_name(value).replace(" ","-")
    return s or "asset"

def cache_page_image(remote_url,object_prefix,name):
    if not remote_url:
        return None
    ext=os.path.splitext(urllib.parse.urlparse(remote_url).path)[1].lower()
    if ext not in (".png",".jpg",".jpeg",".webp",".gif",".svg"):
        ext=".jpg"
    return cache_image(remote_url,object_prefix+"/"+safe_asset_name(name)+ext)

def sync_team_logos():
    urls=[
        "https://www.torreense.com/futebol-profissional/equipa-principal/calendario",
        "https://www.torreense.com/futebol-profissional/equipa-principal/classificacao",
    ]
    teams=json.loads(api("teams?select=id,name&sport_id=eq.1&limit=200"))
    by_name={x["name"].casefold():x for x in teams}
    found=0
    for url in urls:
        try:
            soup=BeautifulSoup(get(url),"html.parser")
        except Exception as e:
            print("TEAM_LOGO_PAGE_FAILED",url,repr(e))
            continue
        for img in soup.find_all("img"):
            alt=(img.get("alt") or "").strip()
            team=by_name.get(alt.casefold())
            if not team:
                continue
            src=page_image_url(img)
            if not src:
                continue
            try:
                cached=cache_page_image(src,"club-assets/teams",team["name"])
                api("teams?id=eq."+str(team["id"]),"PATCH",{"logo_url":cached,"updated_at":datetime.now(timezone.utc).isoformat()})
                found+=1
                print("TEAM_LOGO_CACHED",team["name"],cached)
            except Exception as e:
                print("TEAM_LOGO_FAILED",team["name"],src,repr(e))
    print("TEAM_LOGOS_UPDATED",found)

def sync_player_photos():
    squad_pages={
        "SCU Torreense":"https://www.torreense.com/futebol-profissional/equipa-principal/plantel",
        "SCU Torreense Sub-23":"https://www.torreense.com/futebol-profissional/sub-23-masculino/plantel",
        "SCU Torreense Feminino":"https://torreense.com/futebol-profissional/seniores-feminino/plantel",
        "SCU Torreense Futsal Masculino":"https://www.torreense.com/futsal/seniores-futsal-masculinos/plantel",
        "SCU Torreense Futsal Feminino":"https://www.torreense.com/futsal/seniores-feminino-futsal/plantel",
    }
    teams=json.loads(api("teams?select=id,name&limit=200"))
    team_by_name={x["name"]:x["id"] for x in teams}
    total=0
    for team_name,url in squad_pages.items():
        team_id=team_by_name.get(team_name)
        if not team_id:
            print("PLAYER_PHOTO_TEAM_MISSING",team_name)
            continue
        try:
            soup=BeautifulSoup(get(url),"html.parser")
        except Exception as e:
            print("PLAYER_PHOTO_PAGE_FAILED",url,repr(e))
            continue
        players=json.loads(api("players?select=id,name,short_name&team_id=eq."+str(team_id)+"&active=eq.true&limit=200"))
        player_by_name={}
        for p in players:
            for label in (p.get("name"),p.get("short_name")):
                key=normalize_person_name(label)
                if key:
                    player_by_name[key]=p
        seen=set()
        for img in soup.find_all("img"):
            alt=(img.get("alt") or "").strip()
            alt_key=normalize_person_name(alt)
            player=player_by_name.get(alt_key)
            if not player and alt_key:
                # Some pages use the full legal name while the DB uses the sporting
                # name (or vice versa). Match unique containment only.
                candidates=[]
                for key,p in player_by_name.items():
                    if len(key)>=4 and (key in alt_key or alt_key in key):
                        if p not in candidates:
                            candidates.append(p)
                if len(candidates)==1:
                    player=candidates[0]
            if not player or player["id"] in seen:
                continue
            src=page_image_url(img)
            if not src:
                continue
            try:
                cached=cache_page_image(src,"club-assets/players/"+str(team_id),player["name"])
                api("players?id=eq."+str(player["id"]),"PATCH",{"photo_url":cached,"updated_at":datetime.now(timezone.utc).isoformat()})
                seen.add(player["id"])
                total+=1
                print("PLAYER_PHOTO_CACHED",team_name,player["name"],cached)
            except Exception as e:
                print("PLAYER_PHOTO_FAILED",team_name,player["name"],src,repr(e))
        print("PLAYER_PHOTOS_TEAM",team_name,len(seen),"/",len(players))
    print("PLAYER_PHOTOS_UPDATED",total)

def sync_club_assets():
    sync_team_logos()
    sync_player_photos()

def main():
    sync_club_assets()
    urls=discover_news()

    # If archive discovery is temporarily incomplete, keep any URLs already
    # stored in Supabase in the candidate set so valid cached articles survive.
    try:
        existing=json.loads(api("news?select=url&source=eq.torreense&order=id.asc&limit=1000"))
        for row in existing:
            u=(row.get("url") or "").rstrip("/")
            if u and u not in urls:
                urls.append(u)
    except Exception as e:
        print("EXISTING_URLS_READ_FAILED",repr(e))

    if TEST_NEWS_URL:
        urls=[TEST_NEWS_URL]
    if TEST_NEWS_LIMIT and TEST_NEWS_LIMIT>0:
        urls=urls[:TEST_NEWS_LIMIT]

    print("SYNC_CANDIDATES",len(urls))
    rows=[]
    failures=0
    for u in urls:
        try:
            item=article(u)
            if item:
                rows.append(item)
            else:
                failures+=1
        except Exception as e:
            failures+=1
            print("ARTICLE_FAILED",u,repr(e))

    if not rows:
        raise RuntimeError("No Torreense news imported; keeping previous database snapshot untouched")

    # Upsert by URL. Never delete the whole snapshot merely because the source
    # site returned incomplete HTML for some pages.
    upsert_headers={
        "apikey":KEY,
        "Authorization":"Bearer "+KEY,
        "Content-Type":"application/json",
        "Prefer":"resolution=merge-duplicates,return=minimal"
    }
    api("news?on_conflict=url","POST",rows,headers=upsert_headers)

    now=datetime.now(timezone.utc).isoformat()
    status={
        "source":"torreense_news",
        "last_sync":now,
        "last_success":now,
        "status":"success",
        "message":"Official Torreense news sync",
        "items_processed":len(rows),
        "updated_at":now
    }
    api("sync_status?on_conflict=source","POST",[status])
    api("app_sync?id=eq.1","PATCH",{"version":int(datetime.now().timestamp()),"updated_at":now})
    print("Synced",len(rows),"news items; failures",failures)

if __name__=="__main__":main()
