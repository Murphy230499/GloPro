import os

header_content = """import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import { Sparkles, MapPin, ChevronDown, Bell } from 'lucide-react-native';

export default function Header() {
  const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24);
  
  return (
    <View className="bg-white/95 border-b border-slate-100" style={{ paddingTop: STATUSBAR_HEIGHT }}>
      <View className="h-16 flex-row items-center gap-1.5 px-2">
        <View className="flex-row items-center gap-2 shrink-0">
          <View className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md overflow-hidden bg-pink-400">
            <View className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-500" />
            <Sparkles size={16} color="white" />
          </View>
        </View>

        <View className="flex-row items-center ml-1">
          <TouchableOpacity className="flex-row items-center gap-1 px-2 py-2 rounded-xl bg-slate-100">
            <MapPin size={16} color="#ec4899" />
            <Text className="text-sm font-semibold text-slate-700" numberOfLines={1} style={{ maxWidth: 130 }}>
              Tất cả chi nhánh
            </Text>
            <ChevronDown size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-1 shrink-0 ml-auto">
          <TouchableOpacity className="w-9 h-9 rounded-full items-center justify-center relative">
            <Bell size={20} color="#64748B" />
            <View className="absolute top-1 right-1.5 w-2 h-2 bg-pink-500 rounded-full border border-white" />
          </TouchableOpacity>
          <TouchableOpacity className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 ml-1">
            <Image source={{ uri: 'https://i.pravatar.cc/150?img=11' }} className="w-full h-full" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
"""

with open("/Volumes/Coding/glopro-mobile/src/components/Header.tsx", "w") as f:
    f.write(header_content)

layout_path = "/Volumes/Coding/glopro-mobile/src/app/(tabs)/_layout.tsx"
with open(layout_path, "r") as f:
    layout_content = f.read()

if "import Header from '../../components/Header';" not in layout_content:
    layout_content = layout_content.replace(
        "import { View } from 'react-native';",
        "import { View } from 'react-native';\nimport Header from '../../components/Header';"
    )
    
    layout_content = layout_content.replace(
        "return (\n    <Tabs screenOptions={{",
        "return (\n    <View className=\"flex-1 bg-white\">\n      <Header />\n      <Tabs screenOptions={{"
    )
    
    layout_content = layout_content.replace(
        "    </Tabs>\n  );",
        "    </Tabs>\n    </View>\n  );"
    )

    with open(layout_path, "w") as f:
        f.write(layout_content)
