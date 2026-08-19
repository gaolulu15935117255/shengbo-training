import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS = Path(__file__).with_name("gen-extra-questions.js")
OUT = ROOT / "data" / "questions-extra.js"

text = JS.read_text(encoding="utf-8")
m = re.search(r"const blocks = (\[.*?\])\n\nconst questions", text, re.DOTALL)
if not m:
    raise SystemExit("blocks not found")
js = m.group(1)
js = re.sub(r"(\s)(sub|cat|start|count|freeFirst|items):", r'\1"\2":', js)
js = re.sub(r",(\s*[}\]])", r"\1", js)
blocks = json.loads(js)

questions = []
for block in blocks:
    if len(block["items"]) != block["count"]:
        raise SystemExit(f"{block['sub']}: count mismatch")
    for idx, item in enumerate(block["items"]):
        num = block["start"] + idx
        free = block.get("freeFirst", 0) > 0 and idx < block["freeFirst"]
        questions.append(
            {
                "id": f"q{num}",
                "category": block["cat"],
                "subcategory": block["sub"],
                "type": item[0],
                "stem": item[1],
                "options": item[2],
                "answer": item[3],
                "analysis": item[4],
                "knowledge": item[5],
                "free": free,
            }
        )

if len(questions) != 230:
    raise SystemExit(f"Total {len(questions)}, expected 230")
if questions[0]["id"] != "q71" or questions[-1]["id"] != "q300":
    raise SystemExit("ID range wrong")

OUT.write_text(
    "module.exports = " + json.dumps(questions, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

counts = {}
for q in questions:
    counts[q["subcategory"]] = counts.get(q["subcategory"], 0) + 1
print("Generated", len(questions), "questions")
print("Per subcategory:", counts)
