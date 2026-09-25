#!/usr/bin/env python3
import os,re,json,unicodedata,urllib.request,urllib.parse
from datetime import datetime,timezone,timedelta
from yt_dlp import YoutubeDL

BASE=os.environ["SUPABASE_URL"].rstrip("/")
KEY=os.environ["SUPABASE_SERVICE_ROLE_KEY"]
CHANNEL_URL="https://www.youtube.com/@sporttvportugal/videos"
HEAD={"apikey":KEY,"Authorization":"Bearer "+KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=representation"}

def api(path,method="GET",body=None,headers=None):
    req=urllib.request.Request(
        BASE+"/rest/v1/"+path,
        data=None if body is None else json.dumps(body).encode(),
        headers={**HEAD,**(headers or {})},
        method=method
    )
    with urllib.request.urlopen(req,timeout=40) as r:
        raw=r.read().decode()
        return json.loads(raw) if raw else None

def norm(v):
    s=unicodedata.normalize("NFKD",(v or "").casefold())
    s="".join(ch for ch in s if not unicodedata.combining(ch))
    s=re.sub(r"[^a-z0-9]+"," ",s)
    return " ".join(s.split())

def dt(v):
    if not v:return None
    try:return datetime.fromisoformat(v.replace("Z","+00:00"))
    except Exception:return None

def iso_ts(v):
    if v in (None,""):return None
    try:return datetime.fromtimestamp(float(v),timezone.utc).isoformat()
    except Exception:return None

def iso_upload(v):
    s=str(v or "")
    if not re.fullmatch(r"\d{8}",s):return None
    try:return datetime.strptime(s,"%Y%m%d").replace(tzinfo=timezone.utc).isoformat()
    except Exception:return None

def aliases(name):
    n=norm(name)
    vals={n}
    generic={"scu","sc","sl","fc","cf","ud","cd","afc","clube","futebol","feminino","futsal","masculino","l"}
    words=[w for w in n.split() if w not in generic]
    if words:
        vals.add(" ".join(words))
        # Club suffix/prefixes in the database often disappear from YouTube titles.
        for w in words:
            if len(w)>=5:
                vals.add(w)
    if "torreense" in n:vals.update({"torreense","scu torreense"})
    return [x for x in vals if len(x)>=4]

def extract_scores(title):
    # Handles "FC Porto 1-0 Torreense" and variants.
    m=re.search(r"\b(\d{1,2})\s*[-–:]\s*(\d{1,2})\b",title or "")
    if not m:return None
    return int(m.group(1)),int(m.group(2))

def hydrate(url):
    with YoutubeDL({"quiet":True,"skip_download":True,"ignoreerrors":True}) as ydl:
        return ydl.extract_info(url,download=False)

def candidate_match(video,matches):
    title=norm(video.get("title"))
    published=dt(video.get("published_at"))
    score_pair=extract_scores(video.get("title") or "")
    best=None
    for m in matches:
        home=(m.get("home") or {}).get("name") or ""
        away=(m.get("away") or {}).get("name") or ""
        if "torreense" not in norm(home) and "torreense" not in norm(away):
            continue

        home_hits=[title.find(a) for a in aliases(home) if a in title]
        away_hits=[title.find(a) for a in aliases(away) if a in title]
        if not home_hits or not away_hits:
            continue

        start=dt(m.get("starts_at"))
        if not start:continue
        confidence=0.72
        reasons=["duas equipas no título"]

        if score_pair and m.get("home_score") is not None and m.get("away_score") is not None:
            hs,as_=int(m["home_score"]),int(m["away_score"])
            home_first=min(home_hits)<min(away_hits)
            expected=(hs,as_) if home_first else (as_,hs)
            if score_pair!=expected:
                continue
            confidence+=0.22;reasons.append("resultado e ordem compatíveis")
        else:
            # Without a score, require publication date proximity.
            if not published:
                continue

        if published:
            day_gap=abs((published.date()-start.date()).days)
            if day_gap>7:
                continue
            if day_gap<=1:
                confidence+=0.06;reasons.append("data compatível")
            elif day_gap<=3:
                confidence+=0.03

        if confidence>=0.88 and (best is None or confidence>best[1]):
            best=(m["id"],min(confidence,1.0),", ".join(reasons))
    return best or (None,None,None)

def main():
    now=datetime.now(timezone.utc)
    q="matches?select=id,starts_at,home_score,away_score,home:teams!matches_home_team_id_fkey(name),away:teams!matches_away_team_id_fkey(name)"
    q+="&starts_at=gte."+urllib.parse.quote((now-timedelta(days=500)).isoformat())
    q+="&starts_at=lte."+urllib.parse.quote((now+timedelta(days=2)).isoformat())
    q+="&order=starts_at.desc&limit=600"
    matches=api(q) or []

    with YoutubeDL({"quiet":True,"skip_download":True,"extract_flat":"in_playlist","playlistend":350,"ignoreerrors":True}) as ydl:
        listing=ydl.extract_info(CHANNEL_URL,download=False) or {}
    flat=[e for e in (listing.get("entries") or []) if e]
    # Only hydrate videos whose flat title already contains Torreense.
    candidates=[e for e in flat if "torreense" in norm(e.get("title"))]
    rows=[]
    for e in candidates:
        vid=e.get("id")
        if not vid:continue
        try:
            info=hydrate("https://www.youtube.com/watch?v="+vid) or e
        except Exception:
            info=e
        title=info.get("title") or e.get("title") or ""
        # Only keep official match-summary clips, never flash interviews or shows.
        title_norm=norm(title)
        is_summary=("resumo" in title_norm or "highlights" in title_norm)
        if not is_summary:
            continue
        duration=info.get("duration")
        published=iso_ts(info.get("timestamp") or info.get("release_timestamp")) or iso_upload(info.get("upload_date"))
        row={
            "video_id":vid,
            "channel_handle":"@sporttvportugal",
            "title":title,
            "youtube_url":"https://www.youtube.com/watch?v="+vid,
            "thumbnail_url":info.get("thumbnail") or f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
            "published_at":published,
            "duration_seconds":int(duration) if duration else None,
            "last_seen_at":now.isoformat(),
            "updated_at":now.isoformat()
        }
        mid,confidence,reason=candidate_match(row,matches)
        row["match_id"]=mid
        row["match_confidence"]=confidence
        row["match_reason"]=reason
        rows.append(row)

    if rows:
        api("sporttv_highlights?on_conflict=video_id","POST",rows,{"Prefer":"resolution=merge-duplicates,return=representation"})
    print("SPORTTV_SYNC",len(rows),"videos",sum(1 for x in rows if x["match_id"]),"matched")

if __name__=="__main__":
    main()
