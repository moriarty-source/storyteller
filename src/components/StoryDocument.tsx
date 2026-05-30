import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Story } from "@/types/story";
import { STATIONS } from "@/types/story";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1A1A1A",
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 56,
    lineHeight: 1.5,
  },
  // Header
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 14,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1A1A1A",
    marginBottom: 3,
  },
  codeLine: {
    fontSize: 11,
    color: "#6B7280",
    fontFamily: "Helvetica",
  },
  // Section
  sectionBlock: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginVertical: 14,
  },
  // Character / World
  fieldRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  fieldLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    width: 80,
    color: "#374151",
  },
  fieldValue: {
    fontSize: 11,
    color: "#1A1A1A",
    flex: 1,
  },
  bodyText: {
    fontSize: 11,
    color: "#1A1A1A",
    marginBottom: 6,
  },
  problemText: {
    fontSize: 11,
    color: "#374151",
    marginBottom: 4,
  },
  inventoryText: {
    fontSize: 11,
    color: "#374151",
    marginTop: 4,
  },
  // Stations
  stationBlock: {
    marginBottom: 20,
  },
  stationTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  stationText: {
    fontSize: 11,
    color: "#1A1A1A",
    lineHeight: 1.6,
    marginBottom: 8,
  },
  // Choices
  choicesBlock: {
    marginLeft: 14,
    marginTop: 4,
  },
  choiceRow: {
    marginBottom: 8,
  },
  choiceLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    marginBottom: 2,
  },
  choiceConsequence: {
    fontSize: 10,
    color: "#6B7280",
    marginLeft: 12,
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 28,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 9,
    color: "#9CA3AF",
    fontFamily: "Helvetica",
  },
});

export function StoryDocument({ story }: { story: Story }) {
  return (
    <Document
      title={`${story.character.name}s Abenteuer · ${story.code}`}
      author="Story Maker"
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>{story.character.name}s Abenteuer</Text>
          <Text style={styles.codeLine}>Code: {story.code}</Text>
        </View>

        {/* ── World ── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Die Welt</Text>
          <Text style={styles.bodyText}>{story.world.description}</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Problem:</Text>
            <Text style={styles.fieldValue}>{story.world.problem}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Character ── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Unsere Heldin / Unser Held</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Name:</Text>
            <Text style={styles.fieldValue}>{story.character.name}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Stärke:</Text>
            <Text style={styles.fieldValue}>{story.character.strength}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Ziel:</Text>
            <Text style={styles.fieldValue}>{story.character.goal}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Schwäche:</Text>
            <Text style={styles.fieldValue}>{story.character.weakness}</Text>
          </View>
          {story.character.secret ? (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Geheimnis:</Text>
              <Text style={styles.fieldValue}>{story.character.secret}</Text>
            </View>
          ) : null}
          {story.inventory.length > 0 ? (
            <Text style={styles.inventoryText}>
              Inventar: {story.inventory.join(", ")}
            </Text>
          ) : null}
        </View>

        <View style={styles.divider} />

        {/* ── Stations ── */}
        {story.stations.map((station, idx) => {
          const meta = STATIONS.find((m) => m.id === station.id);
          const roman = ROMAN[idx] ?? String(station.id);
          const title = meta?.title ?? `Station ${station.id}`;

          return (
            <View key={station.id} style={styles.stationBlock} wrap={false}>
              <Text style={styles.stationTitle}>
                {roman}. {title}
              </Text>
              {station.text ? (
                <Text style={styles.stationText}>{station.text}</Text>
              ) : null}
              {station.choices.length > 0 ? (
                <View style={styles.choicesBlock}>
                  {station.choices.map((choice, ci) => (
                    <View key={ci} style={styles.choiceRow}>
                      <Text style={styles.choiceLabel}>
                        {"▸"} {choice.label}
                      </Text>
                      {choice.consequence ? (
                        <Text style={styles.choiceConsequence}>
                          {choice.consequence}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Story Maker</Text>
          <Text style={styles.footerText}>Code: {story.code}</Text>
        </View>
      </Page>
    </Document>
  );
}
