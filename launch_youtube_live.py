"""
Labyrinth BJJ — YouTube Auto-Stream
=====================================
Replaces the Facebook Selenium script with a clean YouTube Data API approach.
No browser automation needed — pure API calls + OBS websocket.

Schedule via crontab (runs 2 min before class):
    28 6  * * 1,2,3,4,5  python3 /path/to/launch_youtube_live.py
    28 8  * * 1,3,5      python3 /path/to/launch_youtube_live.py
    43 16 * * 1,3,5      python3 /path/to/launch_youtube_live.py
    13 17 * * 1,2,3,4,5  python3 /path/to/launch_youtube_live.py
    28 18 * * 1,2,3,4    python3 /path/to/launch_youtube_live.py
    28 19 * * 3,4        python3 /path/to/launch_youtube_live.py
    28 18 * * 5          python3 /path/to/launch_youtube_live.py
    0  9  * * 6          python3 /path/to/launch_youtube_live.py
    0  11 * * 6          python3 /path/to/launch_youtube_live.py
    28 10 * * 0          python3 /path/to/launch_youtube_live.py
    0  12 * * 0          python3 /path/to/launch_youtube_live.py
    0  13 * * 0          python3 /path/to/launch_youtube_live.py

Stop script (run at end of class or add to crontab):
    python3 /path/to/launch_youtube_live.py --stop

Requirements:
    pip install requests google-auth google-auth-httplib2 google-api-python-client websocket-client
"""

import json
import os
import sys
import time
import websocket
import requests
import urllib.parse
from datetime import datetime, timedelta, timezone

from google.oauth2 import service_account
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# ── Config ──────────────────────────────────────────────────────────
OAUTH_CLIENT_SECRET = os.path.expanduser("~/client_secret.json")
OAUTH_TOKEN_FILE   = os.path.expanduser("~/labyrinth_youtube_token.json")
GAS_URL = "https://script.google.com/macros/s/AKfycbwybO9_NBFjSYmpDWVjM0TloiyQl5-oI7UZxgAHDILYHjhez8RUp7ncOgwKLoEHa6kj/exec"
YOUTUBE_API_KEY    = "AIzaSyCFe3-XoPVjP0VE51MGeoua_jxdsSmSczc"
STREAM_KEY         = "2fpc-6fj0-y4ft-f1h5-0mc4"
RTMP_URL           = "rtmp://a.rtmp.youtube.com/live2"
OBS_WS_URL         = "ws://localhost:4455"
OBS_WS_PASSWORD    = ""   # Set if you have a password in OBS → Tools → WebSocket Server Settings
STATE_FILE         = "/tmp/labyrinth_stream_state.json"

DEFAULT_INSTRUCTOR = "Anthony Curry"

# SCHEDULE is loaded live from GAS at runtime (see _load_schedule_from_gas).
# Fallback used only if GAS is unreachable.
SCHEDULE_FALLBACK = {
    ("Monday",    "06:30"): ("Adult BJJ",           "Anthony Curry"),
    ("Monday",    "11:00"): ("Adult BJJ",           "Anthony Curry"),
    ("Monday",    "16:45"): ("Kids BJJ (3-6)",      "Anthony Curry"),
    ("Monday",    "17:15"): ("Kids BJJ (7-12)",     "Anthony Curry"),
    ("Monday",    "18:30"): ("Adult BJJ",           "Anthony Curry"),
    ("Tuesday",   "06:30"): ("Adult BJJ",           "Anthony Curry"),
    ("Tuesday",   "17:15"): ("Kids Grappling (7-12)", "Anthony Curry"),
    ("Tuesday",   "17:15"): ("Teens Grappling (12-15)", "Anthony Curry"),
    ("Tuesday",   "18:30"): ("Adult BJJ",           "Anthony Curry"),
    ("Wednesday", "11:00"): ("Adult BJJ",           "Anthony Curry"),
    ("Wednesday", "16:45"): ("Kids BJJ (3-6)",      "Anthony Curry"),
    ("Wednesday", "17:15"): ("Kids BJJ (7-12)",     "Anthony Curry"),
    ("Wednesday", "18:30"): ("Adult BJJ",           "Anthony Curry"),
    ("Wednesday", "19:30"): ("Wrestling (7-17)",    "Malik Pickett"),
    ("Thursday",  "06:30"): ("Adult BJJ",           "Christian Solano"),
    ("Thursday",  "17:15"): ("Kids Grappling (7-12)", "Anthony Curry"),
    ("Thursday",  "17:15"): ("Teens Grappling (12-15)", "Anthony Curry"),
    ("Thursday",  "18:30"): ("Adult BJJ",           "Anthony Curry"),
    ("Thursday",  "19:30"): ("Wrestling (7-17)",    "Malik Pickett"),
    ("Friday",    "06:30"): ("Adult BJJ",           "Jake Maronge"),
    ("Friday",    "11:00"): ("Adult BJJ",           "Anthony Curry"),
    ("Friday",    "16:45"): ("Kids BJJ (3-6)",      "Anthony Curry"),
    ("Friday",    "17:15"): ("Kids BJJ Comp (7-12)", "Anthony Curry"),
    ("Friday",    "18:30"): ("Adult Comp",          "Anthony Curry"),
    ("Saturday",  "09:00"): ("Adult Comp",          "Anthony Curry"),
    ("Saturday",  "10:00"): ("Kids Grappling (7-12)", "Anthony Curry"),
    ("Saturday",  "11:00"): ("Adult & Teens",       "Anthony Curry"),
    ("Saturday",  "12:00"): ("Kids Grappling (7-12)", "Anthony Curry"),
    ("Sunday",    "10:30"): ("Open Mat",            "Anthony Curry"),
    ("Sunday",    "12:00"): ("Pans Prep",           "Anthony Curry"),
    ("Sunday",    "13:00"): ("Wrestling (7-17)",    "Malik Pickett"),
}

CATEGORY_MAP = {
    "kid": "Kids", "teen": "Kids", "no-gi": "No-Gi", "grappling": "No-Gi",
    "comp": "Comp", "wrestling": "No-Gi", "open mat": "Open Mat",
}

# Cache for live schedule
_LIVE_SCHEDULE = None

def _parse_sheet_time(t):
    """Convert sheet time value to HH:MM string.
    Handles:
      - decimal fraction (0.2708333 = 06:30)
      - ISO date string (1899-12-30T14:30:00.000Z — GAS serialises text times this way)
      - human-readable (6:30 AM, 7:30 PM)
      - plain 24h (18:30)
    Returns HH:MM (24h) or None on failure.
    """
    import re
    if t is None:
        return None
    # If already a number (float/int), treat as day fraction
    if isinstance(t, (int, float)):
        frac = float(t)
        if 0 < frac < 1:
            total_mins = round(frac * 24 * 60)
            h, m = divmod(total_mins, 60)
            return f"{h:02d}:{m:02d}"
    s = str(t).strip()
    # ISO date string: 1899-12-30T14:30:00.000Z — GAS serialises text-entered times
    # as UTC 1899 epoch. These are UTC-encoded local times: subtract local UTC offset.
    # Texas (CDT) = UTC-5 (CDT) or UTC-6 (CST). Use system local offset for robustness.
    iso = re.match(r'\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2}):', s)
    if iso:
        import time as _time
        utc_offset_hours = -(_time.timezone if not _time.daylight else _time.altzone) // 3600
        h_utc = int(iso.group(1))
        m_utc = int(iso.group(2))
        total = h_utc * 60 + m_utc + utc_offset_hours * 60
        total = total % (24 * 60)  # wrap around midnight
        h_local, m_local = divmod(total, 60)
        return f"{h_local:02d}:{m_local:02d}"
    # Decimal fraction as string
    try:
        frac = float(s)
        if 0 < frac < 1:
            total_mins = round(frac * 24 * 60)
            h, m = divmod(total_mins, 60)
            return f"{h:02d}:{m:02d}"
    except ValueError:
        pass
    # HH:MM AM/PM
    m12 = re.match(r'(\d{1,2}):(\d{2})\s*(AM|PM)', s, re.IGNORECASE)
    if m12:
        h, mn, period = int(m12.group(1)), int(m12.group(2)), m12.group(3).upper()
        if period == "PM" and h != 12:
            h += 12
        elif period == "AM" and h == 12:
            h = 0
        return f"{h:02d}:{mn:02d}"
    # Plain HH:MM
    m24 = re.match(r'(\d{1,2}):(\d{2})$', s)
    if m24:
        return f"{int(m24.group(1)):02d}:{int(m24.group(2)):02d}"
    return None

def _load_schedule_from_gas():
    """Fetch the live class schedule from GAS. Returns list of dicts:
    [{day, time_str (HH:MM), title, instructor}, ...]
    """
    global _LIVE_SCHEDULE
    if _LIVE_SCHEDULE is not None:
        return _LIVE_SCHEDULE
    try:
        resp = requests.get(GAS_URL, params={"action": "getScheduleClasses"}, timeout=10)
        data = resp.json()
        classes = data.get("classes") or data.get("schedule") or []
        if not classes:
            raise ValueError("Empty schedule from GAS")
        result = []
        for c in classes:
            day = str(c.get("Day") or c.get("day") or "").strip()
            raw_time = c.get("Time") or c.get("time") or ""
            title = str(c.get("Title") or c.get("title") or c.get("ClassName") or "").strip()
            instructor = str(c.get("Instructor") or c.get("instructor") or DEFAULT_INSTRUCTOR).strip()
            t = _parse_sheet_time(raw_time)
            if day and t and title:
                result.append({"day": day, "time": t, "title": title, "instructor": instructor})
        log(f"📋 Loaded {len(result)} classes from GAS schedule")
        _LIVE_SCHEDULE = result
        return result
    except Exception as e:
        log(f"⚠️  Could not load live schedule from GAS ({e}) — using fallback")
        # Convert fallback to same format
        result = []
        for (day, t), (title, instructor) in SCHEDULE_FALLBACK.items():
            result.append({"day": day, "time": t, "title": title, "instructor": instructor})
        _LIVE_SCHEDULE = result
        return result


# ── Helpers ──────────────────────────────────────────────────────────

def log(msg):
    print(msg, flush=True)

def _get_class_name():
    """Find the closest UPCOMING class within a 30-minute window.
    Prefers classes that haven't started yet (script runs ~2 min early).
    Falls back to the closest class (past or future) within the window.
    Uses the live GAS schedule so titles always match the sheet.
    """
    now = datetime.now()
    day = now.strftime("%A")
    now_mins = now.hour * 60 + now.minute
    schedule = _load_schedule_from_gas()
    today = [c for c in schedule if c["day"] == day]

    # Pass 1: prefer upcoming (0 to +30 min ahead)
    upcoming = None
    upcoming_diff = float('inf')
    for c in today:
        h, m = map(int, c["time"].split(":"))
        class_mins = h * 60 + m
        ahead = class_mins - now_mins
        if 0 <= ahead <= 30 and ahead < upcoming_diff:
            upcoming_diff = ahead
            upcoming = c

    if upcoming:
        log(f"📅 Upcoming class in {upcoming_diff} min: {upcoming['title']} at {upcoming['time']}")
        return upcoming["title"]

    # Pass 2: fallback — closest class within ±30 min
    best = None
    best_diff = float('inf')
    for c in today:
        h, m = map(int, c["time"].split(":"))
        diff = abs(now_mins - (h * 60 + m))
        if diff <= 30 and diff < best_diff:
            best_diff = diff
            best = c

    if best is None:
        log(f"⚠️  No class found within 30 min of {now.strftime('%H:%M')} on {day} — using fallback 'Class'")
        return "Class"
    log(f"📅 Closest class ({best_diff} min offset): {best['title']}")
    return best["title"]

def _get_instructor(class_name):
    """Look up the instructor from the live GAS schedule for the closest matching class today."""
    now = datetime.now()
    day = now.strftime("%A")
    now_mins = now.hour * 60 + now.minute
    schedule = _load_schedule_from_gas()
    today = [c for c in schedule if c["day"] == day and c["title"] == class_name]
    if not today:
        return DEFAULT_INSTRUCTOR
    # Find closest in time
    best = min(today, key=lambda c: abs(now_mins - (int(c["time"].split(":")[0]) * 60 + int(c["time"].split(":")[1]))))
    return best.get("instructor") or DEFAULT_INSTRUCTOR

def _get_category(class_name):
    lower = class_name.lower()
    for k, v in CATEGORY_MAP.items():
        if k in lower:
            return v
    return "Gi"

def _save_state(data):
    with open(STATE_FILE, "w") as f:
        json.dump(data, f)

def _load_state():
    try:
        with open(STATE_FILE) as f:
            return json.load(f)
    except Exception:
        return {}


# ── YouTube API (OAuth via service account) ──────────────────────────

def _get_youtube_client():
    """Build authenticated YouTube client using OAuth (user account)."""
    scopes = ["https://www.googleapis.com/auth/youtube"]
    creds = None

    # Load saved token if it exists
    if os.path.exists(OAUTH_TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(OAUTH_TOKEN_FILE, scopes)

    # Refresh or re-authenticate
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            log("✅ YouTube token refreshed")
        else:
            log("🔐 Opening browser for YouTube authentication...")
            flow = InstalledAppFlow.from_client_secrets_file(OAUTH_CLIENT_SECRET, scopes)
            creds = flow.run_local_server(port=0)
            log("✅ YouTube authenticated")

        # Save token for next run
        with open(OAUTH_TOKEN_FILE, "w") as f:
            f.write(creds.to_json())

    return build("youtube", "v3", credentials=creds)


def create_broadcast(youtube, title, class_name):
    """Create a YouTube live broadcast scheduled for now."""
    now_utc = datetime.now(timezone.utc)
    scheduled_start = (now_utc + timedelta(minutes=1)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    scheduled_end   = (now_utc + timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%S.000Z")

    initial_description = f"Labyrinth BJJ — Live Class Stream\n\n0:00 {class_name}"
    broadcast = youtube.liveBroadcasts().insert(
        part="snippet,status,contentDetails",
        body={
            "snippet": {
                "title": title,
                "description": initial_description,
                "scheduledStartTime": scheduled_start,
                "scheduledEndTime": scheduled_end,
            },
            "status": {
                "privacyStatus": "public",
                "selfDeclaredMadeForKids": False,
            },
            "contentDetails": {
                "enableAutoStart": True,
                "enableAutoStop": True,
                "enableDvr": True,
                "recordFromStart": True,
                "monitorStream": {"enableMonitorStream": False},
            }
        }
    ).execute()

    broadcast_id = broadcast["id"]
    video_url = f"https://youtube.com/live/{broadcast_id}"
    log(f"✅ Broadcast created: {video_url}")
    return broadcast_id, video_url


def bind_stream_to_broadcast(youtube, broadcast_id):
    """
    Bind the persistent OBS stream key to the broadcast.

    YouTube's liveStreams().list() returns your persistent/default stream(s).
    We pick the first active one — this is the stream OBS is already pushing to.
    Matching by streamName/streamKey is unreliable; the first mine=True result
    is always the default channel stream that was set up when you enabled Live.
    """
    streams = youtube.liveStreams().list(
        part="snippet,cdn,status",
        mine=True,
        maxResults=5
    ).execute()

    items = streams.get("items", [])
    stream_id = None

    # Prefer a stream that is already active (OBS is sending data)
    for s in items:
        if s.get("status", {}).get("streamStatus") == "active":
            stream_id = s["id"]
            log(f"✅ Found ACTIVE stream: {stream_id}")
            break

    # Fall back to any existing stream (the persistent default)
    if not stream_id and items:
        stream_id = items[0]["id"]
        log(f"✅ Using default stream: {stream_id} (status: {items[0].get('status', {}).get('streamStatus', 'unknown')})")

    if not stream_id:
        # No existing stream at all — create one
        # (This should only happen on a brand-new channel with no Live history)
        stream = youtube.liveStreams().insert(
            part="snippet,cdn",
            body={
                "snippet": {"title": "Labyrinth BJJ Stream"},
                "cdn": {
                    "frameRate": "variable",
                    "ingestionType": "rtmp",
                    "resolution": "variable",
                }
            }
        ).execute()
        stream_id = stream["id"]
        log(f"✅ Created new stream: {stream_id}")
        log(f"   ⚠️  Update OBS stream key to: {stream['cdn']['ingestionInfo']['streamName']}")

    # Bind broadcast to stream
    youtube.liveBroadcasts().bind(
        part="id,contentDetails",
        id=broadcast_id,
        streamId=stream_id
    ).execute()
    log("✅ Stream bound to broadcast")
    return stream_id


def wait_for_stream_active(youtube, broadcast_id, timeout=180, poll=10):
    """
    Poll the liveStreams bound to this broadcast until at least one is 'active'.
    Returns True when active, False on timeout.
    enableAutoStart means YouTube may go live on its own — we also check the
    broadcast status and treat 'live' as success.
    """
    deadline = time.time() + timeout
    attempt = 0
    while time.time() < deadline:
        attempt += 1
        try:
            # Check broadcast status first (autoStart may have fired)
            bc = youtube.liveBroadcasts().list(
                part="status", id=broadcast_id
            ).execute()
            bc_status = bc.get("items", [{}])[0].get("status", {}).get("lifeCycleStatus", "")
            if bc_status == "live":
                log(f"✅ Broadcast already live (autoStart fired) — status: {bc_status}")
                return True

            # Check stream status
            streams = youtube.liveStreams().list(
                part="status", mine=True, maxResults=5
            ).execute()
            for s in streams.get("items", []):
                if s.get("status", {}).get("streamStatus") == "active":
                    log(f"✅ Stream active after {attempt} poll(s)")
                    return True

            log(f"⏳ Waiting for stream active... (attempt {attempt}, bc_status={bc_status})")
        except Exception as e:
            log(f"⚠️ Poll error: {e}")
        time.sleep(poll)
    log("⚠️ Timed out waiting for stream active")
    return False


def transition_broadcast(youtube, broadcast_id, status, retries=5, delay=10):
    """Transition broadcast to 'live' or 'complete'."""
    for attempt in range(1, retries + 1):
        try:
            youtube.liveBroadcasts().transition(
                broadcastStatus=status,
                id=broadcast_id,
                part="status"
            ).execute()
            log(f"✅ Broadcast transitioned to: {status}")
            return True
        except Exception as e:
            err = str(e)
            if "redundantTransition" in err:
                log(f"ℹ️ Already live (autoStart fired or previous attempt succeeded)")
                return True
            if "invalidTransition" in err or "streamNotActive" in err:
                log(f"⏳ Stream not ready yet (attempt {attempt}/{retries}), retrying in {delay}s... ({err[:80]})")
                time.sleep(delay)
            else:
                log(f"⚠️ Transition error: {err[:120]}")
                time.sleep(delay)
    return False


# ── OBS WebSocket ────────────────────────────────────────────────────

def obs_start_stream():
    """Start OBS streaming via WebSocket (reused from original script)."""
    try:
        log("🔌 Connecting to OBS WebSocket…")
        ws = websocket.create_connection(OBS_WS_URL)
        hello = json.loads(ws.recv())
        log(f"📡 OBS Hello received")

        auth_payload = {"op": 1, "d": {"rpcVersion": 1, "eventSubscriptions": 33}}
        if OBS_WS_PASSWORD:
            import base64, hashlib
            salt = hello["d"]["authentication"]["salt"]
            challenge = hello["d"]["authentication"]["challenge"]
            secret = base64.b64encode(
                hashlib.sha256((OBS_WS_PASSWORD + salt).encode()).digest()
            ).decode()
            auth_str = base64.b64encode(
                hashlib.sha256((secret + challenge).encode()).digest()
            ).decode()
            auth_payload["d"]["authentication"] = auth_str

        ws.send(json.dumps(auth_payload))
        json.loads(ws.recv())  # identified

        ws.send(json.dumps({"op": 6, "d": {"requestType": "StartStream", "requestId": "start_stream"}}))

        for _ in range(10):
            try:
                resp = json.loads(ws.recv())
                if resp.get("op") == 7 and resp.get("d", {}).get("requestId") == "start_stream":
                    if resp["d"].get("requestStatus", {}).get("result"):
                        log("✅ OBS stream started")
                    else:
                        log(f"⚠️ OBS StartStream response: {resp['d'].get('requestStatus')}")
                    break
            except Exception:
                time.sleep(0.3)
        ws.close()
        return True
    except Exception as e:
        log(f"❌ OBS WebSocket error: {e}")
        return False


def obs_stop_stream():
    """Stop OBS streaming via WebSocket."""
    try:
        ws = websocket.create_connection(OBS_WS_URL)
        hello = json.loads(ws.recv())
        ws.send(json.dumps({"op": 1, "d": {"rpcVersion": 1, "eventSubscriptions": 33}}))
        json.loads(ws.recv())
        ws.send(json.dumps({"op": 6, "d": {"requestType": "StopStream", "requestId": "stop_stream"}}))
        for _ in range(10):
            try:
                resp = json.loads(ws.recv())
                if resp.get("op") == 7 and resp.get("d", {}).get("requestId") == "stop_stream":
                    log("✅ OBS stream stopped")
                    break
            except Exception:
                time.sleep(0.3)
        ws.close()
        return True
    except Exception as e:
        log(f"❌ OBS stop error: {e}")
        return False


# ── GAS notify ───────────────────────────────────────────────────────

def _gas_call(payload: dict, timeout: int = 20) -> dict:
    """
    Call the GAS Web App reliably.
    Uses GET with ?action=&payload= so GAS 302 redirects don't strip the body.
    Falls back to POST with allow_redirects=True on failure.
    """
    import urllib.parse
    try:
        params = {
            'action':  payload.get('action', ''),
            'payload': json.dumps({k: v for k, v in payload.items() if k != 'action'}),
        }
        r = requests.get(GAS_URL, params=params, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except Exception:
        # Fallback: POST with redirect following
        try:
            s = requests.Session()
            s.max_redirects = 5
            r2 = s.post(GAS_URL, json=payload, timeout=timeout, allow_redirects=True)
            return r2.json()
        except Exception as e2:
            raise e2


def notify_gas_live(video_url, class_name, instructor):
    try:
        r_data = _gas_call({
            "action": "setStreamLive",
            "isLive": True,
            "videoUrl": video_url,
            "className": class_name,
            "instructorName": instructor,
        }, timeout=20)
        data = r_data
        if data.get("success"):
            log(f"✅ GAS updated — app now shows LIVE")
        else:
            log(f"⚠️ GAS error: {data.get('error')}")
    except Exception as e:
        log(f"❌ GAS notify failed: {e}")


def notify_gas_stop(category):
    try:
        r_data = _gas_call({
            "action": "setStreamLive",
            "isLive": False,
            "category": category,
        }, timeout=20)
        data = r_data
        if data.get("success"):
            archived = "archived ✓" if data.get("autoArchived") else "ended"
            log(f"✅ GAS updated — stream {archived}")
        else:
            log(f"⚠️ GAS error: {data.get('error')}")
    except Exception as e:
        log(f"❌ GAS stop notify failed: {e}")


# ── Main flow ────────────────────────────────────────────────────────

def _get_class_time_str(class_name):
    """Return the scheduled time string (e.g. '5:15 PM') for the matched class."""
    now = datetime.now()
    day = now.strftime("%A")
    now_mins = now.hour * 60 + now.minute
    schedule = _load_schedule_from_gas()
    today = [c for c in schedule if c["day"] == day and c["title"] == class_name]
    if not today:
        return now.strftime("%I:%M %p").lstrip("0")
    best = min(today, key=lambda c: abs(now_mins - (int(c["time"].split(":")[0]) * 60 + int(c["time"].split(":")[1]))))
    h, m = map(int, best["time"].split(":"))
    period = "AM" if h < 12 else "PM"
    h12 = h % 12 or 12
    return f"{h12}:{m:02d} {period}"


def start():
    now = datetime.now()
    class_name = _get_class_name()
    instructor = _get_instructor(class_name)
    class_time = _get_class_time_str(class_name)
    title = now.strftime(f"%A - %m/%d/%y") + f" - {class_time} — {class_name}"
    log(f"\n🎥 Starting stream: {title}")
    log(f"   Instructor: {instructor}")

    # 1. Create YouTube broadcast FIRST so it's in ready state
    try:
        youtube = _get_youtube_client()
        broadcast_id, video_url = create_broadcast(youtube, title, class_name)
    except Exception as e:
        log(f"❌ YouTube API error creating broadcast: {e}")
        # Still start OBS and notify GAS even without a YouTube broadcast
        obs_start_stream()
        notify_gas_live("", class_name, instructor)
        return

    # 2. Start OBS — now streaming to the persistent key YouTube already knows about
    obs_start_stream()
    log("⏳ Waiting 25s for OBS RTMP signal to stabilise at YouTube ingestion…")
    time.sleep(25)

    # 3. Bind the broadcast to the stream OBS is pushing to
    try:
        stream_id = bind_stream_to_broadcast(youtube, broadcast_id)
    except Exception as e:
        log(f"⚠️ Stream bind failed: {e} — continuing, enableAutoStart may still fire")

    # 4. Poll until the stream is active (or YouTube auto-starts via enableAutoStart)
    #    Timeout 3 min — checks every 10s, also detects if autoStart already fired
    log("⏳ Waiting for YouTube to detect the RTMP stream (up to 3 min)…")
    is_active = wait_for_stream_active(youtube, broadcast_id, timeout=180, poll=10)

    if not is_active:
        log("⚠️ Stream not detected as active after 3 min. enableAutoStart is set so YouTube")
        log("   may still go live on its own once RTMP signal stabilises.")
        log(f"   URL: {video_url}")
    else:
        # 5. Explicitly transition to live (fast — 3 retries only, stream is already active)
        log("🚀 Stream active — transitioning broadcast to live…")
        transitioned = transition_broadcast(youtube, broadcast_id, "live", retries=3, delay=5)
        if transitioned:
            log(f"🎉 LIVE: {video_url}")
        else:
            log(f"ℹ️ enableAutoStart may have already fired — check: {video_url}")

    _save_state({
        "broadcast_id": broadcast_id,
        "video_url":    video_url,
        "class_name":   class_name,
        "instructor":   instructor,
        "started_at":   time.time(),
        "chapters":     [{"ts": "0:00", "label": class_name}],
    })
    try:
        notify_gas_live(video_url, class_name, instructor)
        log("✅ GAS notified — app Live banner is active")
        os.system('osascript -e \'display notification "YouTube Live started: ' + class_name + '" with title "Labyrinth Stream"\'') 
    except Exception as e:
        log(f"⚠️ GAS notify failed: {e}")


def _build_description_with_chapters(state: dict, new_class: str, new_time_str: str) -> str:
    """
    Build a YouTube description with chapter timestamps.
    Chapters list grows with each class change.
    YouTube requires:
      - First chapter must start at 0:00
      - At least 3 chapters for the chapter UI to appear
      - Each line: MM:SS or H:MM:SS followed by chapter title
    """
    # Load existing chapters from state or start fresh
    chapters = state.get("chapters", [])

    # Calculate elapsed time from stream start
    started_at = state.get("started_at")
    if started_at:
        elapsed_secs = int(time.time() - started_at)
    else:
        elapsed_secs = 0

    h = elapsed_secs // 3600
    m = (elapsed_secs % 3600) // 60
    s = elapsed_secs % 60
    ts = f"{h}:{m:02d}:{s:02d}" if h > 0 else f"{m}:{s:02d}"

    # First chapter must always be 0:00
    if not chapters:
        chapters.append({"ts": "0:00", "label": new_class})
    else:
        chapters.append({"ts": ts, "label": new_class})

    lines = ["Labyrinth BJJ — Live Class Stream", ""]
    for ch in chapters:
        lines.append(f"{ch['ts']} {ch['label']}")

    return "\n".join(lines), chapters


def update_title():
    """
    Called at each class change while a stream is already live.
    Updates the YouTube broadcast title + GAS live banner to the current class.
    Run this from cron at each class start time (same times as start(), but
    only executes if a broadcast is already running).
    """
    state = _load_state()
    broadcast_id = state.get("broadcast_id")
    if not broadcast_id:
        log("ℹ️  No active broadcast — nothing to update")
        return

    now = datetime.now()
    class_name = _get_class_name()
    instructor = _get_instructor(class_name)
    class_time = _get_class_time_str(class_name)
    new_title  = now.strftime(f"%A - %m/%d/%y") + f" - {class_time} — {class_name}"
    log(f"\n🔄 Updating broadcast title: {new_title}")

    try:
        youtube = _get_youtube_client()

        # Verify broadcast is still live
        resp = youtube.liveBroadcasts().list(part="status,snippet", id=broadcast_id).execute()
        items = resp.get("items", [])
        if not items:
            log("⚠️  Broadcast not found — may have ended already")
            return
        current_status = items[0]["status"]["lifeCycleStatus"]
        if current_status not in ("live", "testing"):
            log(f"ℹ️  Broadcast is '{current_status}', not live — skipping title update")
            return

        # Build updated description with growing chapter timestamps
        new_description, updated_chapters = _build_description_with_chapters(state, class_name, class_time)
        log(f"📋 Chapters so far:\n{new_description}")

        # Update title + description via liveBroadcasts.update
        snippet = items[0]["snippet"]
        snippet["title"]       = new_title
        snippet["description"] = new_description
        youtube.liveBroadcasts().update(
            part="snippet",
            body={"id": broadcast_id, "snippet": snippet}
        ).execute()
        log(f"✅ Title + chapters updated")

    except Exception as e:
        log(f"⚠️  Title update failed: {e}")
        updated_chapters = state.get("chapters", [])

    # Re-notify GAS so app banner shows the new class name
    try:
        video_url = state.get("video_url", "")
        notify_gas_live(video_url, class_name, instructor)
        log(f"✅ GAS re-notified — banner updated to: {class_name}")
    except Exception as e:
        log(f"⚠️  GAS notify failed: {e}")

    # Save updated state including new chapters list
    _save_state({**state, "class_name": class_name, "instructor": instructor, "chapters": updated_chapters})
    os.system(f'osascript -e \'display notification "Title updated: {class_name}" with title "Labyrinth Stream"\'') 


def stop():
    state = _load_state()
    class_name = state.get("class_name") or _get_class_name()
    broadcast_id = state.get("broadcast_id")
    category = _get_category(class_name)

    log(f"\n⏹️ Stopping stream: {class_name}")

    # 1. Stop OBS
    obs_stop_stream()

    # 2. End YouTube broadcast
    if broadcast_id:
        try:
            youtube = _get_youtube_client()

            # Check current broadcast status
            resp = youtube.liveBroadcasts().list(
                part="status", id=broadcast_id
            ).execute()
            items = resp.get("items", [])
            current_status = items[0]["status"]["lifeCycleStatus"] if items else "unknown"
            log(f"📡 Broadcast status: {current_status}")

            # YouTube requires: ready/testing → live → complete
            # If not yet live, transition to live first, then complete
            if current_status in ("ready", "testStarting", "testing"):
                log("⚡ Broadcast not live yet — transitioning to live first...")
                transition_broadcast(youtube, broadcast_id, "live", retries=3, delay=5)
                import time; time.sleep(3)

            if current_status != "complete":
                transition_broadcast(youtube, broadcast_id, "complete", retries=3, delay=5)
            else:
                log("ℹ️  Broadcast already complete")

        except Exception as e:
            log(f"⚠️ Could not end broadcast: {e}")
            log("   → Go to YouTube Studio and end it manually if needed")
    else:
        log("⚠️ No broadcast ID in state — end the broadcast manually in YouTube Studio if needed")

    # 3. Notify GAS
    notify_gas_stop(category)

    # Clean state
    try:
        os.remove(STATE_FILE)
    except Exception:
        pass

    os.system('osascript -e \'display notification "Stream ended and archived" with title "Labyrinth Stream"\'')
    log("✅ Done")



def test_connections():
    """Run --test to verify OBS, YouTube, and GAS are all reachable before going live."""
    log("\n🔍 Running pre-stream connection test…")
    ok = True

    # 1. OBS WebSocket
    try:
        import websocket as ws_mod
        ws = ws_mod.create_connection(OBS_WS_URL, timeout=5)
        ws.close()
        log("  ✅ OBS WebSocket — reachable")
    except Exception as e:
        log(f"  ❌ OBS WebSocket — FAILED: {e}")
        log(f"     → Make sure OBS is open and Tools → WebSocket Server is enabled on port 4455")
        ok = False

    # 2. YouTube API / OAuth token
    try:
        youtube = _get_youtube_client()
        youtube.liveBroadcasts().list(part="id", broadcastStatus="active", maxResults=1).execute()
        log("  ✅ YouTube API — authenticated")
    except Exception as e:
        log(f"  ❌ YouTube API — FAILED: {e}")
        log(f"     → Run the script once normally to re-authenticate via browser")
        ok = False

    # 3. GAS endpoint
    try:
        result = _gas_call({"action": "getStreamStatus"}, timeout=10)
        if result is not None:
            live = result.get("isLive", False)
            log(f"  ✅ GAS endpoint — reachable (currently {'LIVE' if live else 'offline'})")
        else:
            raise ValueError("Empty response")
    except Exception as e:
        log(f"  ❌ GAS endpoint — FAILED: {e}")
        ok = False

    # 4. Current class auto-detection
    class_name = _get_class_name()
    instructor = _get_instructor(class_name)
    log(f"  ℹ️  Current class would be: '{class_name}' with {instructor}")

    log("\n" + ("✅ All systems GO — ready to stream!" if ok else "⚠️  Fix the above issues before going live"))
    return ok


def status():
    """Run --status to check if a stream is currently live."""
    try:
        result = _gas_call({"action": "getStreamStatus"}, timeout=10)
        if result and result.get("isLive"):
            log(f"\n🔴 LIVE — {result.get('className', '')} ({result.get('durationMinutes', 0)}m)")
            log(f"   Instructor: {result.get('instructor', '')}")
            log(f"   URL: {result.get('videoUrl', 'n/a')}")
        else:
            log("\n⚫ Not live")
    except Exception as e:
        log(f"❌ Could not reach GAS: {e}")

if __name__ == "__main__":
    if "--stop" in sys.argv:
        stop()
    elif "--update" in sys.argv:
        update_title()
    elif "--test" in sys.argv:
        test_connections()
    elif "--status" in sys.argv:
        status()
    else:
        start()
