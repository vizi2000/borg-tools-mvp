// CVComponent.js
// Production‑ready React‑PDF component implementing the “state‑of‑art” neon‑on‑black CV.
// Usage: <Document><CV data={cvJson} /></Document>

import React from "react";
import {
  Page,
  Text,
  View,
  Link,
  StyleSheet,
  Font,
  Svg,
  Rect,
  Line,
} from "@react-pdf/renderer";

/* ---------- 1. Font registration ---------- */
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrKqsek.woff2", fontStyle: "normal", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrKqsek-Bold.woff2", fontStyle: "normal", fontWeight: 700 },
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrKqsek-Medium.woff2", fontStyle: "normal", fontWeight: 500 },
  ],
});
Font.register({
  family: "SpaceGrotesk",
  src: "https://fonts.gstatic.com/s/spacegrotesk/v5/i7doW2VQ1FZbmW8ZC.woff2",
  fontStyle: "normal",
  fontWeight: 600,
});

/* ---------- 2. Design tokens ---------- */
const COLORS = {
  bg: "#0d0d0d",
  accent: "#39ff14",
  accentSoft: "#83ff8e",
  text: "#ffffff",
  muted: "#c4c4c4",
};

/* ---------- 3. StyleSheet ---------- */
const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: COLORS.bg, fontFamily: "Inter", color: COLORS.text, fontSize: 10, lineHeight: 1.4 },
  displayName: { fontFamily: "SpaceGrotesk", fontSize: 24, lineHeight: 1, color: COLORS.text, marginBottom: 4 },
  role: { fontSize: 12, color: COLORS.muted, marginBottom: 4 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  links: { flexDirection: "row", gap: 8 },
  link: { color: COLORS.accent, fontSize: 8, textDecoration: "none" },
  h1: { fontSize: 16, fontWeight: 700, marginBottom: 4, color: COLORS.accent },
  stackSection: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  chip: { borderColor: COLORS.accent, borderWidth: 1, borderRadius: 4, padding: "2pt 4pt", marginRight: 4, marginBottom: 4, fontSize: 8 },
  vertBarWrap: { width: 12, height: 80, borderColor: COLORS.accentSoft, borderWidth: 1, borderRadius: 4, marginLeft: 8 },
  about: { marginBottom: 12, fontSize: 10 },
  cards: { marginBottom: 12 },
  card: { borderColor: COLORS.accent, borderWidth: 1, borderRadius: 12, padding: 8, marginBottom: 8 },
  cardTitle: { color: COLORS.accent, fontWeight: 700, fontSize: 10, marginBottom: 2 },
  timeline: { borderLeftColor: COLORS.accentSoft, borderLeftWidth: 2, paddingLeft: 8 },
  timelineItem: { fontSize: 8, marginBottom: 4 },
});

/* ---------- 4. Helper components ---------- */
const ModernityBar = ({ score }) => (
  <Svg width={12} height={80} style={{ borderRadius: 4, overflow: "hidden" }}>
    <Rect x={0} y={0} width={12} height={80} fill="transparent" stroke={COLORS.accentSoft} strokeWidth={1} />
    <Rect x={0} y={80 - (score * 0.8)} width={12} height={score * 0.8} fill={COLORS.accent} />
  </Svg>
);

/* ---------- 5. Main CV component ---------- */
const CV = ({ data }) => (
  <Page size="A4" style={styles.page} wrap>
    {/* 1. Header */}
    <View style={styles.headerRow}>
      <View>
        <Text style={styles.displayName}>{data.header.name}</Text>
        <Text style={styles.role}>{data.header.target_role} • {data.header.location}</Text>
      </View>
      <View style={styles.links}>
        {data.header.links.github && (
          <Link style={styles.link} src={`https://${data.header.links.github}`}>GitHub</Link>
        )}
        {data.header.links.linkedin && (
          <Link style={styles.link} src={`https://${data.header.links.linkedin}`}>LinkedIn</Link>
        )}
        {data.header.links.email && (
          <Link style={styles.link} src={`mailto:${data.header.links.email}`}>Email</Link>
        )}
      </View>
    </View>

    {/* 2. Stack & Modernity */}
    <Text style={styles.h1}>Stack & Modernity</Text>
    <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
      <View style={styles.stackSection}>
        {data.stack.map((tech) => (
          <Text key={tech.tech} style={styles.chip}>{tech.tech} {"▮".repeat(tech.level)}{"▯".repeat(10 - tech.level)}</Text>
        ))}
      </View>
      <ModernityBar score={data.modernity_score} />
    </View>

    {/* 3. About */}
    <Text style={styles.h1}>O mnie</Text>
    <Text style={styles.about}>{data.about}</Text>

    {/* 4. Projects */}
    <Text style={styles.h1}>Top projekty</Text>
    <View style={styles.cards}>
      {data.projects.map((p) => (
        <View key={p.name} style={styles.card} wrap={false}>
          <Link src={`https://${p.url}`} style={styles.cardTitle}>{p.name}</Link>
          <Text>{p.description}</Text>
          <Text style={{ fontSize: 8, color: COLORS.muted }}>
            ★ {p.stars} • {p.commits} commitów • {p.stack.join(", ")}
          </Text>
        </View>
      ))}
    </View>

    {/* 5. Timeline */}
    <Text style={styles.h1}>Timeline rozwoju</Text>
    <View style={styles.timeline}>
      {data.evolution.map((e) => (
        <Text key={e.date} style={styles.timelineItem}>{e.date} — {e.change}</Text>
      ))}
    </View>
  </Page>
);

export default CV;
