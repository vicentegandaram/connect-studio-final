import { buildPackage } from "../src/lib/package";
import { DEFAULT_DNA } from "../src/lib/store";
import { hasBlocking, reviewPost } from "../src/lib/ethics";
import { slugify, trackedLink, withLink } from "../src/lib/links";
import { makePost } from "../src/lib/store";

let fails = 0;
const t = (name: string, cond: boolean) => { if (!cond) { fails++; console.log(`✗ ${name}`); } };

for (const perWeek of [3, 5, 7] as const) {
  const pk = buildPackage(DEFAULT_DNA, "minimal-clinico", [], { approach: "TCC", target_population: "Adultos", recurring_concern: "ansiedad y sobrepensamiento", tone: "calido", perWeek }, 0);
  t(`${perWeek}/semana → ${perWeek * 2} piezas`, pk.length === perWeek * 2);
  t(`${perWeek}/semana: todas en borrador, ninguna aprobada`, pk.every((p) => p.status === "borrador" && !p.approvedAt));
  t(`${perWeek}/semana: todas con fecha y descripción`, pk.every((p) => !!p.scheduledAt && !!p.caption));
  t(`${perWeek}/semana: ninguna con error ético`, pk.every((p) => !hasBlocking(reviewPost(p))));
  t(`${perWeek}/semana: planId únicos`, new Set(pk.map((p) => p.planId)).size === pk.length);
}
const a = { approach: "TCC", target_population: "Adultos", recurring_concern: "ansiedad", tone: "calido", perWeek: 5 } as const;
const first = buildPackage(DEFAULT_DNA, "minimal-clinico", [], a, 0);
t("no duplica un paquete ya creado", buildPackage(DEFAULT_DNA, "minimal-clinico", first, a, 0).length === 0);
t("fechas de la semana 2 son posteriores", first.slice(-1)[0]!.scheduledAt! > first[0]!.scheduledAt!);

t("slug sin tildes ni título", slugify("Ps. Camila Rojas Ñuñoa") === "camila-rojas-nunoa");
const post = makePost("frase-validacion", "minimal-clinico", { frase: "x", apoyo: "" });
const link = trackedLink(DEFAULT_DNA, post);
t("link con slug y src", link.includes("/p/camila-rojas?") && link.includes("src=ig-") && link.includes("utm_campaign=frase-validacion"));
t("withLink no duplica", withLink(withLink("Hola", link), link).split(link).length === 2);

console.log(fails ? `\n${fails} fallos en paquete/links` : "paquete de 2 semanas y links: todos correctos");
process.exit(fails ? 1 : 0);
