"""Builds the contests embedded in the app (training, offline) and the importable JSON files in docs/concours/.
Source of truth: apps/api/prisma/seed-contests.json (the sheets are copied as-is, only names/ids change)."""
import json, sys

ROOT = sys.argv[1]
seed = {c["name"]: c for c in json.load(open(f"{ROOT}/apps/api/prisma/seed-contests.json", encoding="utf-8"))}

BUILTIN = [
    ("robee", "RoBee, un robot pollinisateur", "Défi robotique 2019 - Cycle 2"),
    ("gardbot", "Une nuit au musée avec GardBot", "Défi robotique 2019 - Cycle 3"),
    ("mars2-cycle2", "Mars II - cycle 2", "Défi Mars II 2027 - Cycle 2"),
    ("mars2-cycle3", "Mars II - cycle 3", "Défi Mars II 2027 - Cycle 3"),
]

contests = []
for key, name, seed_name in BUILTIN:
    c = seed[seed_name]
    contests.append({"id": key, "name": name, "season": c["season"], "description": c.get("description"), "sheet": c["sheet"]})
    # Importable file (admin > Concours > Importer): full contest, created as a draft.
    with open(f"{ROOT}/docs/concours/{key}.json", "w", encoding="utf-8") as f:
        json.dump({"name": name, "season": c["season"], "description": c.get("description"), "published": False, "sheet": c["sheet"]},
                  f, ensure_ascii=False, indent=2)
        f.write("\n")

body = json.dumps(contests, ensure_ascii=False, indent=2)
ts = (
    "// Généré par scripts/make_builtin.py à partir de apps/api/prisma/seed-contests.json : ne pas modifier à la main.\n"
    "// Concours intégrés à l'appli : disponibles en entraînement sans serveur ni connexion.\n"
    "import type { BuiltinContest } from './api.service';\n\n"
    f"export const BUILTIN_CONTESTS: BuiltinContest[] = {body};\n\n"
    "export const builtinContest = (id: string) => BUILTIN_CONTESTS.find((c) => c.id === id);\n"
)
open(f"{ROOT}/apps/app/src/app/builtin-contests.ts", "w", encoding="utf-8").write(ts)
print("ok", [c["id"] for c in contests])
