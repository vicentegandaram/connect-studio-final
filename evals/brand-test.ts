import { isPrivateAddress, normalizeUrl, parseSite } from "../api/_lib/brandParse";

let fails = 0;
const t = (name: string, cond: boolean) => { if (!cond) { fails++; console.log(`✗ ${name}`); } };

// SSRF: lo que NO debe pasar
for (const bad of ["http://localhost/admin", "http://127.0.0.1", "https://169.254.169.254/latest/meta-data", "http://10.0.0.5", "file:///etc/passwd", "ftp://x.cl", "https://user:pw@sitio.cl", "https://sitio.cl:8080", "http://[::1]/", "http://miservidor.local", "intranet", "http://2130706433"])
  t(`bloquea ${bad}`, normalizeUrl(bad) === null);
for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fe80::1", "fd00::1", "::ffff:10.0.0.1", "224.0.0.1"])
  t(`IP privada ${ip}`, isPrivateAddress(ip));
for (const ip of ["8.8.8.8", "172.32.0.1", "200.1.2.3", "2606:4700::1111"])
  t(`IP pública ${ip}`, !isPrivateAddress(ip));
// URLs válidas
t("acepta dominio sin protocolo", normalizeUrl("tupsicologa.cl")?.hostname === "tupsicologa.cl");
t("acepta https con ruta", normalizeUrl("https://www.camilarojas.cl/sobre-mi")?.hostname === "www.camilarojas.cl");

// Parseo
const html = `<html><head><title>Camila Rojas | Psicóloga clínica TCC</title>
<meta name="description" content="Terapia cognitivo-conductual para adultos con ansiedad. Online y presencial.">
<meta property="og:site_name" content="Camila Rojas Psicología"><meta name="theme-color" content="#3F624D">
<meta name="keywords" content="psicóloga, ansiedad, TCC, terapia online">
<style>.a{color:#3f624d}.b{background:#3F624D}.c{color:#a44b35}.d{color:#ffffff}.e{color:#333333}</style></head>
<body><h1>Terapia para la ansiedad</h1><h2>Atención a adultos</h2></body></html>`;
const s = parseSite(html);
t("nombre desde og:site_name", s.name === "Camila Rojas Psicología");
t("descripción", s.description.startsWith("Terapia cognitivo-conductual"));
t("detecta TCC", s.approach === "TCC");
t("detecta adultos", s.population === "Adultos");
t("theme-color", s.themeColor === "#3f624d");
t("colores sin grises ni blanco", s.colors[0] === "#3f624d" && !s.colors.includes("#ffffff") && !s.colors.includes("#333333"));
t("keywords", s.keywords.includes("ansiedad"));
t("web vacía no rompe", parseSite("").name === "" && parseSite("<html></html>").approach === null);
t("HTML gigante se acota", parseSite("a".repeat(5_000_000)).name === "");

console.log(fails ? `\n${fails} fallos en brand` : "análisis de marca y SSRF: todos correctos");
process.exit(fails ? 1 : 0);
