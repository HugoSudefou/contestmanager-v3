import readExcelFile from 'read-excel-file/browser';

/** Same layout as the 2018 back office workbook. Row 1 of each sheet is a header. */
export interface ImportEntry {
  school: string;
  teacher: string;
  className: string;
  level: string;
  team: string;
  students: { lastName: string; firstName: string; role?: string }[];
}

type Row = unknown[];
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

export async function readWorkbook(file: File): Promise<{ entries: ImportEntry[]; errors: string[] }> {
  const sheets = await readExcelFile(file);
  const sheet = (name: string): Row[] => {
    const found = sheets.find((s) => s.sheet.trim().toLowerCase() === name);
    if (!found) throw new Error(`Onglet « ${name} » introuvable. Onglets attendus : ecole, classe, equipe, ecole-classe-equipe.`);
    return (found.data as Row[]).slice(1).filter((r) => str(r[0]));
  };
  const index = (rows: Row[]) => new Map(rows.map((r) => [str(r[0]), r]));
  const schools = index(sheet('ecole'));
  const classes = index(sheet('classe'));
  const teams = index(sheet('equipe'));

  const errors: string[] = [];
  const entries: ImportEntry[] = [];
  for (const [i, r] of sheet('ecole-classe-equipe').entries()) {
    const [schoolId, classId, teamId] = [str(r[0]), str(r[1]), str(r[2])];
    const school = schools.get(schoolId);
    const cls = classes.get(classId);
    const team = teams.get(teamId);
    const line = `ecole-classe-equipe ligne ${i + 2}`;
    if (!school) {
      errors.push(`${line} : école ${schoolId} inconnue.`);
      continue;
    }
    if (!cls) {
      errors.push(`${line} : classe ${classId} inconnue.`);
      continue;
    }
    if (!teamId) {
      errors.push(`${line} : numéro d'équipe manquant.`);
      continue;
    }
    if (!str(cls[1])) {
      errors.push(`${line} : enseignant manquant pour la classe ${classId}.`);
      continue;
    }

    // Students come in (nom, prénom, rôle) triples from column B.
    const students: ImportEntry['students'] = [];
    for (let c = 1; team && c + 1 < team.length; c += 3) {
      const [lastName, firstName, role] = [str(team[c]), str(team[c + 1]), str(team[c + 2])];
      if (lastName || firstName) students.push({ lastName: lastName || '?', firstName: firstName || '?', role: role || undefined });
    }
    entries.push({
      school: str(school[1]),
      teacher: str(cls[1]),
      className: str(cls[2]) || classId,
      level: str(cls[3]) || '?',
      team: teamId,
      students,
    });
  }
  return { entries, errors };
}
