#!/usr/bin/env python3
import os,re,json,unicodedata,urllib.request,urllib.parse
from datetime import datetime,timezone,timedelta
from yt_dlp import YoutubeDL

BASE=os.environ["SUPABASE_URL"].rstrip("/")
KEY=os.environ["SUPABASE_SERVICE_ROLE_KEY"]
CHANNEL_ID="UCgYHOF4IAZSTdEH_EO_aQoQ"
CHANNEL_STREAMS=f"https://www.youtube.com/channel/{CHANNEL_ID}/streams"
CHANNEL_LIVE=f"https://www.youtube.com/channel/{CHANNEL_ID}/live"
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

def aliases(name):
    n=norm(name)
    values={n}
    for token in ("scu ","sc ","sl ","fc ","cf ","ud ","cd ","afc "," clube"," futebol"," feminino"," futsal masculino"," futsal feminino"," futsal"):
        n=n.replace(token," ")
    n=" ".join(n.split())
    if n: values.add(n)
    if "torreense" in norm(name): values.update({"torreense","scu torreense"})
    return [x for x in values if len(x)>=4]

def iso_ts(v):
    if v in (None,""): return None
    try:return datetime.fromtimestamp(float(v),timezone.utc).isoformat()
    except Exception:return None

def iso_upload_date(v):
    s=str(v or "")
    if not re.fullmatch(r"\d{8}",s):return None
    try:return datetime.strptime(s,"%Y%m%d").replace(tzinfo=timezone.utc).isoformat()
    except Exception:return None

def dt(v):
    if not v:return None
    try:return datetime.fromisoformat(v.replace("Z","+00:00"))
    except Exception:return None

def row_from(info):
    vid=info.get("id")
    if not vid:return None
    thumb=info.get("thumbnail")
    if not thumb and info.get("thumbnails"):
        thumb=(info["thumbnails"][-1] or {}).get("url")
    status=info.get("live_status") or ("is_live" if info.get("is_live") else "not_live")
    return {
        "video_id":vid,
        "channel_id":CHANNEL_ID,
        "title":info.get("title") or "SCUTV",
        "youtube_url":"https://www.youtube.com/watch?v="+vid,
        "thumbnail_url":thumb or f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
        "live_status":status,
        "published_at":iso_ts(info.get("timestamp") or info.get("release_timestamp")) or iso_upload_date(info.get("upload_date")),
        "scheduled_start":iso_ts(info.get("release_timestamp")),
        "actual_start":iso_ts(info.get("start_time")),
        "actual_end":iso_ts(info.get("end_time")),
        "duration_seconds":int(info["duration"]) if info.get("duration") else None,
        "last_seen_at":datetime.now(timezone.utc).isoformat(),
        "updated_at":datetime.now(timezone.utc).isoformat()
    }

def match_video(video,matches):
    title=norm(video["title"])
    # Do not attach academy/youth streams to senior fixtures merely because
    # the opponent has the same club name.
    if re.search(r"\b(sub ?(?:17|19|23)|junior(?:es)?|juvenil(?:is)?)\b",title):
        return (None,None,None)
    is_live=video.get("live_status") in ("is_live","is_upcoming")
    when=dt(video.get("scheduled_start") or video.get("actual_start") or video.get("published_at"))
    if not when and is_live:
        when=datetime.now(timezone.utc)
    if not when and not is_live:
        return (None,None,None)
    best=None
    for m in matches:
        start=dt(m.get("starts_at"))
        if not start:continue
        home=(m.get("home") or {}).get("name") or ""
        away=(m.get("away") or {}).get("name") or ""
        if "torreense" not in norm(home) and "torreense" not in norm(away):continue
        opponent=away if "torreense" in norm(home) else home
        opp_hit=any(a in title for a in aliases(opponent))
        tor_hit=("torreense" in title or "scut" in title)
        hours=abs((when-start).total_seconds())/3600 if when else 9999
        score=0; reason=[]
        if opp_hit: score+=0.68;reason.append("adversário")
        if tor_hit: score+=0.12;reason.append("Torreense")
        if hours<=8: score+=0.20;reason.append("hora")
        elif hours<=36: score+=0.14;reason.append("data")
        elif hours<=72: score+=0.06;reason.append("data próxima")
        if is_live and hours<=6 and tor_hit:
            score=max(score,0.80);reason.append("direto ativo")
        if score>=0.72 and (best is None or score>best[1]):
            best=(m["id"],min(score,1.0),", ".join(reason))
    return best or (None,None,None)

def extract(url,flat=False,end=None):
    opts={"quiet":True,"skip_download":True,"ignoreerrors":True}
    if flat: opts["extract_flat"]="in_playlist"
    if end: opts["playlistend"]=end
    with YoutubeDL(opts) as ydl:
        return ydl.extract_info(url,download=False)

def main():
    now=datetime.now(timezone.utc)
    q="matches?select=id,starts_at,status,home:teams!matches_home_team_id_fkey(name),away:teams!matches_away_team_id_fkey(name)"
    q+="&starts_at=gte."+urllib.parse.quote((now-timedelta(days=370)).isoformat())
    q+="&starts_at=lte."+urllib.parse.quote((now+timedelta(days=90)).isoformat())
    q+="&order=starts_at.asc&limit=500"
    matches=api(q) or []

    playlist=extract(CHANNEL_STREAMS,flat=True,end=120) or {}
    entries=[e for e in (playlist.get("entries") or []) if e]

    try:
        live=extract(CHANNEL_LIVE)
        if live and live.get("live_status") in ("is_live","is_upcoming"):
            entries.insert(0,live)
    except Exception as e:
        print("LIVE_CHECK_WARNING",repr(e))

    rows=[];seen=set()
    for i,e in enumerate(entries):
        vid=e.get("id")
        if not vid or vid in seen:continue
        seen.add(vid)
        info=e
        if i<18:
            try:
                full=extract("https://www.youtube.com/watch?v="+vid)
                if full:info=full
            except Exception:pass
        row=row_from(info)
        if not row:continue
        mid,confidence,reason=match_video(row,matches)
        row["match_id"]=mid
        row["match_confidence"]=confidence
        row["match_reason"]=reason
        rows.append(row)

    if rows:
        api("scutv_videos?on_conflict=video_id","POST",rows,{"Prefer":"resolution=merge-duplicates,return=representation"})
    print("SCUTV_SYNC",len(rows),"videos",sum(1 for x in rows if x["match_id"]),"matched",sum(1 for x in rows if x["live_status"]=="is_live"),"live")

if __name__=="__main__":
    main()
