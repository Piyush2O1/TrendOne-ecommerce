// ⚠️  Replace YOUR_API_KEY with your project's API key
// API key was shown once at project creation

// PulseIQ — React Native  |  Project: 69c2c2b93b6f59647eb3c014
import AsyncStorage from "@react-native-async-storage/async-storage";

const CONFIG = {
  apiKey:    "pk_b70c28a2539d4a8e813337409d068eb3",
  projectId: "69c2c2b93b6f59647eb3c014",
  endpoint:  "https://pulseiq-ffio.onrender.com/api/ingest/event",
};

async function getAnonId() {
  let id = await AsyncStorage.getItem("_piq_anon");
  if (!id) { id = "anon_" + Math.random().toString(36).slice(2, 11); await AsyncStorage.setItem("_piq_anon", id); }
  return id;
}

export async function track(eventName: string, properties: Record<string, any> = {}) {
  try {
    const [anonId, userId] = await Promise.all([getAnonId(), AsyncStorage.getItem("_piq_user")]);
    await fetch(CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": CONFIG.apiKey },
      body: JSON.stringify({ projectId: CONFIG.projectId, eventName, userId: userId || undefined, anonymousId: anonId, properties }),
    });
  } catch (e) {}
}

export async function identify(userId: string | number) {
  await AsyncStorage.setItem("_piq_user", String(userId));
  await track("identify", { userId });
}

// useFocusEffect(() => { track("screen_view", { screen: "Home" }); }); ye h reactnative ka