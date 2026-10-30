import { makePost } from "../src/lib/store";
import { reviewTexts } from "../src/lib/ethics";
import { canMove, invalidateApproval, moveTo } from "../src/lib/workflow";

const clean = reviewTexts({ t: "Tus emociones son señales que escuchar." });
const dirty = reviewTexts({ t: "Te vas a curar en 3 sesiones." });
const base = makePost("frase-validacion", "minimal-clinico", { frase: "Hola", apoyo: "" });
let fails = 0;
const t = (name: string, cond: boolean) => { if (!cond) { fails++; console.log(`✗ ${name}`); } };

t("borrador siempre se puede", canMove(base, "borrador", dirty).ok);
t("no se aprueba con problema ético", !canMove(base, "aprobado", dirty).ok);
t("se aprueba con revisión limpia", canMove(base, "aprobado", clean).ok);
t("no se programa sin aprobación", !canMove({ ...base, scheduledAt: "2026-11-02" }, "programado", clean).ok);
t("no se publica sin aprobación", !canMove(base, "publicado", clean).ok);

const approved = moveTo(base, "aprobado", clean).post;
t("aprobar guarda la fecha de aprobación", !!approved.approvedAt && approved.status === "aprobado");
t("no se programa sin fecha aunque esté aprobada", !canMove(approved, "programado", clean).ok);
t("se programa con aprobación y fecha", canMove({ ...approved, scheduledAt: "2026-11-02" }, "programado", clean).ok);
t("aprobada pero con problema ético sobreviniente no sale", !canMove(approved, "publicado", dirty).ok);
t("editar invalida la aprobación", invalidateApproval(approved).status === "borrador" && !invalidateApproval(approved).approvedAt);
t("una publicada no se degrada al editar", invalidateApproval({ ...approved, status: "publicado" }).status === "publicado");
t("volver a borrador quita la aprobación", !moveTo(approved, "borrador", clean).post.approvedAt);

console.log(fails ? `\n${fails} fallos en el flujo` : "flujo de aprobación: 12/12 correctos");
process.exit(fails ? 1 : 0);
