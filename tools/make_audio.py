#!/usr/bin/env python3
"""Generates audio for the course: single clips and per-lesson "car" tracks.

Reads  data/course.json
Writes audio/clips/*.mp3, audio/car/*.mp3, audio/manifest.json

Needs: pip install edge-tts, and ffmpeg/ffprobe in PATH.
Set FAKE_TTS=1 to test the pipeline offline (tones instead of speech).
"""
import asyncio, hashlib, json, os, re, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "audio"
CLIPS = OUT / "clips"
CAR = OUT / "car"
VOICE = {"sr": "sr-RS-SophieNeural", "sr2": "sr-RS-NicholasNeural", "ru": "ru-RU-SvetlanaNeural"}
FAKE = os.environ.get("FAKE_TTS") == "1"
SR_RATE = "-5%"


def run(*cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


# Microsoft's Serbian neural voices are trained on Cyrillic. Fed Latin text they
# fall back to English letter rules, so Serbian is transliterated before synthesis.
_DI = {"lj": "љ", "nj": "њ", "dž": "џ", "Lj": "Љ", "Nj": "Њ", "Dž": "Џ", "LJ": "Љ", "NJ": "Њ", "DŽ": "Џ"}
_CH = dict(zip("abvgdđežzijklmnoprstćufhcčšABVGDĐEŽZIJKLMNOPRSTĆUFHCČŠ",
               "абвгдђежзијклмнопрстћуфхцчшАБВГДЂЕЖЗИЈКЛМНОПРСТЋУФХЦЧШ"))
_CH.update({"z": "з", "ž": "ж", "Z": "З", "Ž": "Ж"})


def to_cyr(text):
    out, i = [], 0
    while i < len(text):
        two = text[i:i + 2]
        if two in _DI:
            out.append(_DI[two]); i += 2
        else:
            out.append(_CH.get(text[i], text[i])); i += 1
    return "".join(out)


def clip_path(lang, text):
    h = hashlib.sha1(f"v2|{lang}|{text}".encode()).hexdigest()[:12]
    return CLIPS / f"{lang}-{h}.mp3"


def clean_ru(text):
    """Russian glosses carry notes like '(экав.)' or '/'; read only the plain words."""
    t = re.sub(r"\([^)]*\)", " ", text)
    t = re.sub(r"[«»\"/]", " ", t)
    return re.sub(r"\s+", " ", t).strip() or text


async def synth(lang, text):
    p = clip_path(lang, text)
    if p.exists() and p.stat().st_size > 1200:
        return p
    if FAKE:
        run("ffmpeg", "-y", "-f", "lavfi", "-i", f"sine=frequency={300 + len(text) * 7}:duration={0.4 + len(text) * 0.06:.2f}",
            "-ar", "24000", "-ac", "1", "-b:a", "48k", str(p))
        return p
    import edge_tts
    for attempt in range(6):
        try:
            rate = SR_RATE if lang.startswith("sr") else "+0%"
            spoken = to_cyr(text) if lang.startswith("sr") else clean_ru(text)
            await edge_tts.Communicate(spoken, VOICE[lang], rate=rate).save(str(p))
            if p.stat().st_size > 1200:
                return p
        except Exception as e:  # network hiccup: retry
            print("retry", lang, text[:30], e, file=sys.stderr)
            await asyncio.sleep(3 + attempt * 4)
    # Never fail the whole site for one clip: leave a short silence and report it.
    print("GAVE UP, silent placeholder:", lang, text, file=sys.stderr)
    run("ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "0.3",
        "-ar", "24000", "-ac", "1", "-b:a", "8k", str(p))  # tiny file: next build retries it
    return p


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout.strip()
    return float(out)


def silence(seconds, tmp):
    p = Path(tmp) / f"sil-{seconds:.2f}.mp3"
    if not p.exists():
        run("ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", f"{seconds:.2f}",
            "-ar", "24000", "-ac", "1", "-b:a", "48k", str(p))
    return p


async def main():
    course = json.loads((ROOT / "data" / "course.json").read_text(encoding="utf-8"))
    CLIPS.mkdir(parents=True, exist_ok=True)
    CAR.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(3)

    async def limited(lang, text):
        async with sem:
            return await synth(lang, text)

    dpath = ROOT / "data" / "dialogs.json"
    dialogs = json.loads(dpath.read_text(encoding="utf-8"))["dialogs"] if dpath.exists() else []

    # 1. every Serbian and Russian text used by the course and the dialogs
    wanted = set()
    for L in course["lessons"]:
        wanted.add(("ru", f"Урок {L['n']}. {L['title']}."))
        for sr, ru in L["w"] + L["d"]:
            wanted.add(("sr", sr))
            wanted.add(("ru", ru))
    for D in dialogs:
        wanted.add(("ru", f"Диалог. {D['title']}."))
        for who, sr, ru in D["lines"]:
            wanted.add(("sr" if who == "A" else "sr2", sr))
            wanted.add(("ru", ru))
    await asyncio.gather(*[limited(l, t) for l, t in sorted(wanted)])

    manifest = {"clips": {}, "car": {}}
    for want in ("sr", "sr2"):
        for lang, text in wanted:
            if lang == want:
                manifest["clips"].setdefault(text, "clips/" + clip_path(lang, text).name)

    # 2. car tracks: RU prompt -> pause -> SR -> pause to repeat aloud
    def voice_of(D, sr):
        return "sr" if next(w for w, s_, _ in D["lines"] if s_ == sr) == "A" else "sr2"

    with tempfile.TemporaryDirectory() as tmp:
        def build(tid, intro, title, blocks, dialog=None):
            parts, cues, t = [], [], 0.0

            def add(path, cue=None):
                nonlocal t
                if cue:
                    cues.append([round(t, 2)] + cue)
                parts.append(path)
                t += duration(path)

            def gap(sec):
                nonlocal t
                parts.append(silence(sec, tmp))
                t += sec

            add(clip_path("ru", intro), ["", title, "intro"])
            gap(1.2)
            for kind, items in blocks:
                if kind == "play":  # dialog played through once without pauses
                    for sr, ru in items:
                        add(clip_path(voice_of(dialog, sr), sr), [sr, ru, "line"])
                        gap(0.7)
                    gap(1.5)
                    continue
                for sr, ru in items:
                    lang = voice_of(dialog, sr) if dialog else "sr"
                    add(clip_path("ru", ru), [sr, ru, kind])
                    gap(1.2)
                    d = duration(clip_path(lang, sr))
                    add(clip_path(lang, sr))
                    gap(d + 1.5)  # time to repeat aloud
                    if not dialog:
                        add(clip_path(lang, sr))
                        gap(1.4)
            lst = Path(tmp) / f"{tid}.txt"
            lst.write_text("".join(f"file '{p}'\n" for p in parts), encoding="utf-8")
            out = CAR / f"{tid}.mp3"
            run("ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
                "-ar", "24000", "-ac", "1", "-b:a", "48k", str(out))
            manifest["car"][tid] = {"file": f"car/{tid}.mp3", "dur": round(t, 1), "cues": cues}
            print(tid, f"{t/60:.1f} min")

        for L in course["lessons"]:
            build(L["id"], f"Урок {L['n']}. {L['title']}.", L["title"], [("word", L["w"]), ("line", L["d"])])
        for D in dialogs:
            pairs = [(sr, ru) for _, sr, ru in D["lines"]]
            build(D["id"], f"Диалог. {D['title']}.", D["title"], [("play", pairs), ("line", pairs)], dialog=D)

    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    asyncio.run(main())
