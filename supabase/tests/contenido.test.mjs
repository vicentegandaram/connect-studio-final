// Prueba la migración 0001 ejecutándola en Postgres local (PGlite): node supabase/tests/contenido.test.mjs
// Requiere: npm i --no-save @electric-sql/pglite
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const db = new PGlite();
const A = "00000000-0000-0000-0000-00000000000a"; // psicólogo
const B = "00000000-0000-0000-0000-00000000000b"; // editor del equipo
const C = "00000000-0000-0000-0000-00000000000c"; // otro psicólogo
let fails = 0;
const t = (name, cond) => { if (!cond) { fails++; console.log(`✗ ${name}`); } };

await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role anon; create role authenticated;
  grant usage on schema public, auth to authenticated, anon;
  grant execute on function auth.uid() to authenticated, anon;
  insert into auth.users values ('${A}'), ('${B}'), ('${C}');
`);
await db.exec(readFileSync(new URL("../migrations/0001_contenido_studio.sql", import.meta.url), "utf8"));
await db.exec(`grant select, insert, update, delete on all tables in schema public to authenticated;`);

const as = async (uid) => { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role authenticated;`); };
const tryQ = async (sql, params = []) => { try { return { rows: (await db.query(sql, params)).rows }; } catch (e) { return { err: String(e.message ?? e), code: e.code }; } };
const row = async (id) => (await db.query("select status, approved_at, approved_by, scheduled_at from public.studio_posts where id=$1", [id])).rows[0];
const newPost = (owner, extra = "") => `insert into public.studio_posts (user_id, format, ratio, kit_id, fields ${extra ? ", " + extra.split("=")[0] : ""}) values ('${owner}', 'frase-validacion', 'feed-square', 'minimal-clinico', '{"frase":"hola"}' ${extra ? ", " + extra.split("=")[1] : ""}) returning id`;

await as(A);
const p = (await db.query(newPost(A))).rows[0].id;
t("el dueño crea una pieza en borrador", (await row(p)).status === "borrador");
const forced = (await db.query(newPost(A, "status='aprobado'"))).rows[0].id;
t("una pieza no puede nacer aprobada", (await row(forced)).status === "borrador" && (await row(forced)).approved_at === null);

await as(C);
t("otro psicólogo no ve las piezas ajenas", (await db.query("select 1 from public.studio_posts")).rows.length === 0);
await as(B);
t("un editor sin acceso no ve nada", (await db.query("select 1 from public.studio_posts")).rows.length === 0);
t("un editor sin acceso no puede crear piezas para otro", !!(await tryQ(newPost(A))).err);
t("un editor no puede darse acceso solo", !!(await tryQ(`insert into public.studio_team_access (owner_id, member_id) values ('${A}', '${B}')`)).err);

await as(A);
await db.exec(`insert into public.studio_team_access (owner_id, member_id) values ('${A}', '${B}')`);
await as(B);
t("con acceso, el editor ve las piezas", (await db.query("select 1 from public.studio_posts")).rows.length === 2);
const pb = (await db.query(newPost(A))).rows[0].id;
t("el editor prepara una pieza para el psicólogo", (await row(pb)).status === "borrador");
const ap = await tryQ("update public.studio_posts set status='aprobado' where id=$1", [p]);
t("el editor NO puede aprobar", !!ap.err && (await row(p)).status === "borrador");
const man = await tryQ("update public.studio_posts set approved_at=now(), approved_by=$2 where id=$1", [p, A]);
t("nadie puede escribir la aprobación a mano", (await row(p)).approved_at === null);

await as(A);
await db.query("update public.studio_posts set status='aprobado' where id=$1", [p]);
let r = await row(p);
t("el psicólogo aprueba", r.status === "aprobado" && r.approved_at !== null && r.approved_by === A);
const un = await tryQ("update public.studio_posts set status='programado' where id=$1", [pb]);
t("no se programa una pieza sin aprobar", !!un.err);
const nodate = await tryQ("update public.studio_posts set status='programado' where id=$1", [p]);
t("no se programa sin fecha", !!nodate.err);

await as(B);
await db.query("update public.studio_posts set status='programado', scheduled_at='2026-11-05' where id=$1", [p]);
t("el editor programa una pieza ya aprobada, con fecha", (await row(p)).status === "programado");
await db.query("update public.studio_posts set status='aprobado' where id=$1 and false", [p]);

await as(A);
await db.query("update public.studio_posts set status='aprobado' where id=$1", [p]).catch(() => {});
await as(B);
await db.query("update public.studio_posts set status='borrador' where id=$1", [p]);
await as(A);
await db.query("update public.studio_posts set status='aprobado' where id=$1", [p]);
await as(B);
await db.query(`update public.studio_posts set fields='{"frase":"cambió"}' where id=$1`, [p]);
r = await row(p);
t("editar una pieza aprobada anula la aprobación", r.status === "borrador" && r.approved_at === null);

await as(A);
await db.query("update public.studio_posts set status='aprobado' where id=$1", [p]);
await db.query("update public.studio_posts set status='publicado' where id=$1", [p]);
t("el psicólogo puede publicar una pieza aprobada", (await row(p)).status === "publicado");
await as(B);
await db.query(`update public.studio_posts set caption='nota posterior' where id=$1`, [p]);
t("editar una pieza publicada no la degrada", (await row(p)).status === "publicado");

await as(A);
const ev = (await db.query("select event from public.studio_post_events where post_id=$1 order by id", [p])).rows.map((x) => x.event);
t("queda auditoría de creación y aprobación", ev[0] === "creada" && ev.includes("aprobada") && ev.includes("aprobacion_revocada") && ev.includes("publicada"));
t("los eventos no se pueden escribir a mano", !!(await tryQ(`insert into public.studio_post_events (post_id, user_id, event) values ('${p}', '${A}', 'aprobada')`)).err);
await as(C);
t("otro psicólogo no ve la auditoría ajena", (await db.query("select 1 from public.studio_post_events")).rows.length === 0);

console.log(fails ? `\n${fails} fallos en la migración` : "migración de contenido: todas las reglas de acceso y aprobación correctas");
process.exit(fails ? 1 : 0);
