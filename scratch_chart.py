import re

with open("/Volumes/Coding/glopro-mobile/src/app/(tabs)/index.tsx", "r") as f:
    content = f.read()

# Add imports for Chart
if "import { BarChart } from 'react-native-gifted-charts';" not in content:
    content = content.replace(
        "// import { BarChart } from 'react-native-gifted-charts'; // Will implement chart later if needed strictly, for now keep structure",
        "import { BarChart } from 'react-native-gifted-charts';"
    )

# Implement last7Days logic
last_7_logic = """const todayStr = () => new Date().toISOString().slice(0, 10);

const last7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    days.push({
      key: dt.toISOString().slice(0, 10),
      label: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dt.getDay()],
    });
  }
  return days;
};"""
content = content.replace("const todayStr = () => new Date().toISOString().slice(0, 10);", last_7_logic)

# Compute chartData
chart_data_logic = """  const completedToday = todayAppts.filter((a) => a.status === 'completed').length;

  const days = last7Days();
  const chartData = days.map((d) => ({
    label: d.label,
    value: invoices.filter((i) => i.date === d.key).reduce((s, i) => s + (i.total || 0), 0)
  }));"""
content = content.replace("  const completedToday = todayAppts.filter((a) => a.status === 'completed').length;", chart_data_logic)

# Replace the Chart UI placeholder
chart_ui = """<View className="h-[220px] items-center justify-center bg-slate-50 rounded-xl">
              <Text className="text-slate-400 text-sm">Biểu đồ đang cập nhật</Text>
            </View>"""
new_chart_ui = """<View className="mt-2 h-[220px]">
              <BarChart
                data={chartData.map(d => ({ value: d.value, label: d.label, frontColor: '#FF6B9D' }))}
                barWidth={26}
                spacing={12}
                roundedTop
                roundedBottom={false}
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: '#94A3B8', fontSize: 11 }}
                xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 12 }}
                noOfSections={4}
                yAxisLabelPrefix=""
                formatYLabel={(v: string) => {
                  const val = Number(v);
                  if (val >= 1000000) return (val / 1000000) + 'tr';
                  if (val >= 1000) return Math.round(val / 1000) + 'k';
                  return v;
                }}
              />
            </View>"""
content = content.replace(chart_ui, new_chart_ui)

with open("/Volumes/Coding/glopro-mobile/src/app/(tabs)/index.tsx", "w") as f:
    f.write(content)
