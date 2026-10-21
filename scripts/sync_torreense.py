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
    hero=None

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
                if hero is None:
                    hero=cached
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

    # Reuse the first cached article image as the card/hero image. The media
    # remains in content_html as well; the app suppresses the duplicate at render time.
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


MAIN_CALENDAR_URL="https://www.torreense.com/futebol-profissional/equipa-principal/calendario"
MAIN_STANDINGS_URL="https://www.torreense.com/futebol-profissional/equipa-principal/classificacao"
MAIN_COMPETITION_ID=1
MAIN_SPORT_ID=1

def _as_int(value):
    try:
        return int(str(value).strip())
    except Exception:
        return None

def _sports_soup(url,required_selector):
    candidates=[
        url,
        url+("?_" if "?" in url else "?_")+str(int(datetime.now(timezone.utc).timestamp())),
        url.replace("https://www.torreense.com/","https://torreense.com/")+("?_" if "?" in url else "?_")+str(int(datetime.now(timezone.utc).timestamp())),
    ]
    last=None
    lean_headers={
        "User-Agent":"Mozilla/5.0",
        "Accept":"text/html,*/*",
    }
    for attempt,candidate in enumerate(candidates,1):
        try:
            req=urllib.request.Request(candidate,headers=lean_headers)
            with urllib.request.urlopen(req,timeout=25) as r:
                body=r.read().decode("utf-8","ignore")
            soup=BeautifulSoup(body,"html.parser")
            found=soup.select(required_selector)
            print("SPORTS_FETCH",attempt,candidate,"bytes",len(body),"selector",required_selector,"found",len(found))
            if found:
                return soup
            last=RuntimeError("selector not found in "+candidate)
        except Exception as e:
            last=e
            print("SPORTS_FETCH_RETRY",attempt,candidate,repr(e))
    raise RuntimeError("Official Torreense sports page unavailable: "+repr(last))


def _team_key(value):
    s=normalize_person_name(value)
    aliases={
        "scu torreense":"scu torreense",
        "torreense":"scu torreense",
        "academica":"academica",
        "academica oaf":"academica",
        "l lourosa fc":"l lourosa fc",
        "lusitania lourosa":"l lourosa fc",
        "fc felgueiras 1932":"fc felgueiras",
        "felgueiras":"fc felgueiras",
        "uniao de leiria":"u leiria",
        "ud leiria":"u leiria",
    }
    return aliases.get(s,s)

def _team_map(sport_id=None):
    suffix="&sport_id=eq."+str(sport_id) if sport_id else ""
    rows=json.loads(api("teams?select=id,name,short_name,sport_id,gender&active=eq.true"+suffix+"&limit=500"))
    out={}
    for row in rows:
        for label in (row.get("name"),row.get("short_name")):
            if label:
                out[_team_key(label)]=row
    return out

def _merge_match_date(existing_iso,official_date,time_confirmed=False):
    d=datetime.strptime(official_date,"%d.%m.%Y")
    if existing_iso:
        try:
            old=datetime.fromisoformat(existing_iso.replace("Z","+00:00"))
            if old.tzinfo is None:
                old=old.replace(tzinfo=timezone.utc)
            # Keep an already confirmed kick-off time while applying any official date correction.
            if time_confirmed:
                return old.replace(year=d.year,month=d.month,day=d.day).isoformat()
        except Exception:
            pass
    # The Torreense calendar currently exposes the date but not the kick-off time.
    # Noon UTC is only a placeholder; raw_data.time_confirmed=false prevents the app
    # from displaying it as an official hour.
    return d.replace(hour=12,minute=0,second=0,tzinfo=timezone.utc).isoformat()

def _sync_status(source,message,count,status="success"):
    now=datetime.now(timezone.utc).isoformat()
    payload={
        "source":source,
        "last_sync":now,
        "last_success":now if status=="success" else None,
        "status":status,
        "message":message,
        "items_processed":count,
        "updated_at":now,
    }
    api("sync_status?on_conflict=source","POST",[payload])
    return now

def sync_main_standings():
    print("SPORTS_SYNC_STANDINGS_START",MAIN_STANDINGS_URL)
    soup=_sports_soup(MAIN_STANDINGS_URL,"table")
    table=soup.find("table")
    if table is None:
        raise RuntimeError("Official Torreense standings table not found")

    teams=_team_map(MAIN_SPORT_ID)
    existing=json.loads(api(
        "standings?select=id,team_id,competition_id&competition_id=eq."+str(MAIN_COMPETITION_ID)+"&limit=100"
    ))
    existing_by_team={int(x["team_id"]):x for x in existing if x.get("team_id") is not None}
    now=datetime.now(timezone.utc).isoformat()
    updated=0
    missing=[]

    for tr in table.find_all("tr"):
        cells=[x.get_text(" ",strip=True) for x in tr.find_all("td")]
        if len(cells)<9 or not str(cells[0]).strip().isdigit():
            continue
        pos=_as_int(cells[0])
        team_name=cells[1].strip()
        team=teams.get(_team_key(team_name))
        if not team:
            missing.append(team_name)
            continue
        played,wins,draws,losses,gf,ga,points=[_as_int(x) for x in cells[2:9]]
        if None in (pos,played,wins,draws,losses,gf,ga,points):
            print("STANDINGS_ROW_SKIPPED",cells)
            continue
        payload={
            "competition_id":MAIN_COMPETITION_ID,
            "team_id":team["id"],
            "position":pos,
            "played":played,
            "wins":wins,
            "draws":draws,
            "losses":losses,
            "goals_for":gf,
            "goals_against":ga,
            "goal_difference":gf-ga,
            "points":points,
            "source":"torreense",
            "updated_at":now,
        }
        if int(team["id"]) in existing_by_team:
            api(
                "standings?competition_id=eq."+str(MAIN_COMPETITION_ID)+"&team_id=eq."+str(team["id"]),
                "PATCH",
                payload
            )
        else:
            api("standings","POST",payload)
        updated+=1

    if updated<10:
        raise RuntimeError("Official Torreense standings sync returned only "+str(updated)+" rows")
    if missing:
        print("STANDINGS_TEAMS_MISSING",missing)
    _sync_status("torreense_standings","Official Torreense first-team standings sync",updated)
    print("SPORTS_SYNC_STANDINGS_DONE",updated)

def sync_main_matches():
    print("SPORTS_SYNC_MATCHES_START",MAIN_CALENDAR_URL)
    soup=_sports_soup(MAIN_CALENDAR_URL,".match-row")
    rows=soup.select(".match-row")
    if not rows:
        raise RuntimeError("Official Torreense match rows not found")

    teams=_team_map(MAIN_SPORT_ID)
    existing=json.loads(api(
        "matches?select=id,source_id,starts_at,venue,raw_data&competition_id=eq."+str(MAIN_COMPETITION_ID)+"&limit=100"
    ))
    existing_by_source={x.get("source_id"):x for x in existing if x.get("source_id")}
    now=datetime.now(timezone.utc).isoformat()
    updated=0
    missing=[]

    for row in rows:
        date_el=row.select_one(".label-date")
        if not date_el:
            continue
        label=date_el.get_text(" ",strip=True)
        m=re.search(r"(\d{2}\.\d{2}\.\d{4})\s*\|\s*(J\d+)",label,re.I)
        if not m:
            continue
        official_date,round_label=m.group(1),m.group(2).upper()
        comp_img=row.select_one("img.competition-logo")
        comp_label=(comp_img.get("alt") if comp_img else "") or ""
        if comp_label and "meu super" not in comp_label.casefold() and "liga portugal" not in comp_label.casefold():
            continue

        logos=row.select("img.teamlogo-list")
        names=[]
        for img in logos:
            name=(img.get("alt") or "").strip()
            if name and name not in names:
                names.append(name)
        if len(names)<2:
            # Desktop headings are a safe fallback if image alt text changes.
            heads=[x.get_text(" ",strip=True) for x in row.select("h3") if x.get_text(" ",strip=True)]
            for name in heads:
                if name not in names:
                    names.append(name)
        if len(names)<2:
            print("MATCH_TEAMS_UNREADABLE",label)
            continue
        home_name,away_name=names[0],names[1]
        home=teams.get(_team_key(home_name))
        away=teams.get(_team_key(away_name))
        if not home or not away:
            missing.append((home_name,away_name))
            continue

        score_el=row.select_one(".vs-label-front")
        score=(score_el.get_text(" ",strip=True) if score_el else "").replace(" ","")
        sm=re.fullmatch(r"(\d+)-(\d+)",score)
        home_score=_as_int(sm.group(1)) if sm else None
        away_score=_as_int(sm.group(2)) if sm else None
        match_status="finished" if sm else "scheduled"

        round_num=re.sub(r"\D","",round_label)
        source_id="liga-2026-2027-j"+round_num
        old=existing_by_source.get(source_id) or {}
        raw=dict(old.get("raw_data") or {})
        time_confirmed=raw.get("time_confirmed") is True
        raw.update({
            "source_url":MAIN_CALENDAR_URL,
            "official_date":official_date,
            "time_confirmed":time_confirmed,
            "official_sync":True,
        })
        post_link=None
        for a in row.find_all("a",href=True):
            href=a.get("href") or ""
            if "vsports.pt" in href:
                post_link=href
                break
        if post_link:
            raw["post_match_url"]=post_link

        payload={
            "sport_id":MAIN_SPORT_ID,
            "competition_id":MAIN_COMPETITION_ID,
            "home_team_id":home["id"],
            "away_team_id":away["id"],
            "event_type":"match",
            "round":round_label,
            "starts_at":_merge_match_date(old.get("starts_at"),official_date,time_confirmed),
            "status":match_status,
            "home_score":home_score,
            "away_score":away_score,
            "source":"torreense",
            "source_id":source_id,
            "source_torreense_id":source_id,
            "raw_data":raw,
            "updated_at":now,
        }
        if old.get("id"):
            api("matches?id=eq."+str(old["id"]),"PATCH",payload)
        else:
            api("matches","POST",payload)
        updated+=1

    if updated<20:
        raise RuntimeError("Official Torreense calendar sync returned only "+str(updated)+" matches")
    if missing:
        print("MATCH_TEAMS_MISSING",missing)
    _sync_status("torreense_matches","Official Torreense first-team calendar/results sync",updated)
    print("SPORTS_SYNC_MATCHES_DONE",updated)

def sync_sports():
    errors=[]
    for name,fn in (("standings",sync_main_standings),("matches",sync_main_matches)):
        try:
            fn()
        except Exception as e:
            errors.append(name+": "+repr(e))
            print("SPORTS_SYNC_FAILED",name,repr(e))
    if errors:
        # Do not block news/photo refresh if one sports source changes markup.
        _sync_status("torreense_sports","; ".join(errors),0,status="error")
    else:
        now=_sync_status("torreense_sports","Official Torreense sports sync",2)
        api("app_sync?id=eq.1","PATCH",{"version":int(datetime.now().timestamp()),"updated_at":now})


def sync_club_assets():
    sync_team_logos()
    sync_player_photos()

def main():
    sync_sports()
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
