import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ComponentProps } from "react";
import { coverFields, signatureRows, type NdaValues } from "@/lib/nda";
import type { Inline, StandardTerms } from "@/lib/standardTerms";

const styles = StyleSheet.create({
  page: {
    paddingVertical: 44,
    paddingHorizontal: 60,
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    lineHeight: 1.35,
  },
  title: { fontFamily: "Times-Bold", fontSize: 17, textAlign: "center", marginBottom: 12 },
  sectionHeading: { fontFamily: "Times-Bold", fontSize: 10.5, marginTop: 8 },
  hint: { fontFamily: "Helvetica", fontSize: 8, color: "#78716c" },
  paragraph: { marginTop: 2 },
  bold: { fontFamily: "Times-Bold" },
  term: { textDecoration: "underline" },
  link: { color: "#1c1917", textDecoration: "underline" },
  placeholder: { color: "#b45309" },
  table: { marginTop: 10, borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#a8a29e" },
  row: { flexDirection: "row" },
  cell: {
    flex: 1,
    minHeight: 21,
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#a8a29e",
  },
  labelCell: { flex: 0.7, fontFamily: "Times-Bold" },
  headerCell: { fontFamily: "Times-Bold", textAlign: "center" },
  clause: { marginTop: 8, textAlign: "justify" },
  attribution: { marginTop: 16, fontSize: 9, color: "#57534e" },
});

function InlineText({ parts }: { parts: Inline[] }) {
  return parts.map((part, i) => {
    switch (part.type) {
      case "bold":
        return (
          <Text key={i} style={styles.bold}>
            {part.text}
          </Text>
        );
      case "term":
        return (
          <Text key={i} style={styles.term}>
            {part.text}
          </Text>
        );
      case "link":
        return (
          <Link key={i} src={part.href} style={styles.link}>
            {part.text}
          </Link>
        );
      default:
        return part.text;
    }
  });
}

type Style = NonNullable<ComponentProps<typeof View>["style"]>;

function Cell({ style = {}, children }: { style?: Style; children?: string }) {
  return (
    <View style={[styles.cell, style].flat()}>
      <Text>{children}</Text>
    </View>
  );
}

export function NdaPdf({ values, terms }: { values: NdaValues; terms: StandardTerms }) {
  const parties = [values.party1, values.party2];

  return (
    <Document title="Mutual Non-Disclosure Agreement" creator="PreLegal">
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>
        <Text style={styles.sectionHeading}>USING THIS MUTUAL NON-DISCLOSURE AGREEMENT</Text>
        <Text style={styles.paragraph}>
          This Mutual Non-Disclosure Agreement (the “MNDA”) consists of: (1) this Cover Page (“
          <Text style={styles.bold}>Cover Page</Text>”) and (2) the Common Paper Mutual NDA
          Standard Terms Version 1.0 (“<Text style={styles.bold}>Standard Terms</Text>”) identical
          to those posted at{" "}
          <Link src="https://commonpaper.com/standards/mutual-nda/1.0" style={styles.link}>
            commonpaper.com/standards/mutual-nda/1.0
          </Link>
          . Any modifications of the Standard Terms should be made on the Cover Page, which will
          control over conflicts with the Standard Terms.
        </Text>

        {coverFields(values).map((field) => (
          <View key={field.heading} wrap={false}>
            <Text style={styles.sectionHeading}>
              {field.heading}
              {field.hint && <Text style={styles.hint}>{`   ${field.hint}`}</Text>}
            </Text>
            <Text style={[styles.paragraph, field.value ? {} : styles.placeholder]}>
              {field.value ?? field.placeholder}
            </Text>
          </View>
        ))}

        <Text style={[styles.paragraph, { marginTop: 10 }]}>
          By signing this Cover Page, each party agrees to enter into this MNDA as of the
          Effective Date.
        </Text>

        <View style={styles.table} wrap={false}>
          <View style={styles.row}>
            <Cell style={styles.labelCell} />
            <Cell style={styles.headerCell}>PARTY 1</Cell>
            <Cell style={styles.headerCell}>PARTY 2</Cell>
          </View>
          {signatureRows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Cell style={styles.labelCell}>{row.label}</Cell>
              {parties.map((party, i) => (
                <Cell key={i}>{row.key ? party[row.key] : ""}</Cell>
              ))}
            </View>
          ))}
        </View>
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{terms.title}</Text>
        {terms.clauses.map((clause) => (
          <Text key={clause.number} style={styles.clause}>
            {clause.number}. <Text style={styles.bold}>{clause.heading}</Text>.{" "}
            <InlineText parts={clause.body} />
          </Text>
        ))}
        <Text style={styles.attribution}>
          <InlineText parts={terms.attribution} />
        </Text>
      </Page>
    </Document>
  );
}
