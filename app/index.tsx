import { Redirect } from 'expo-router';

// Entry — the root _layout's Stack.Protected guards handle the real routing,
// so just bounce to the tabs group; if unauthed/unapproved the guards redirect.
export default function Index() {
  return <Redirect href="/(tabs)/chat" />;
}
