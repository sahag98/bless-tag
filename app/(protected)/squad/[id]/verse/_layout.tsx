import { Stack } from 'expo-router';

export default function VerseLayout() {
  console.log('here');
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="verse/index" />
      <Stack.Screen
        name="verse/[book]"
        options={{
          presentation: 'modal',
          sheetAllowedDetents: [0.75, 1],
          sheetGrabberVisible: true,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="verse/[chapter]"
        options={{
          presentation: 'modal',
          sheetAllowedDetents: [0.75, 1],
          sheetGrabberVisible: true,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]/prayer"
        options={{
          presentation: 'modal',
          sheetAllowedDetents: [0.75, 1],
          sheetGrabberVisible: true,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]/encourage"
        options={{
          presentation: 'modal',
          sheetAllowedDetents: [0.75, 1],
          sheetGrabberVisible: true,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]/verse"
        options={{
          presentation: 'modal',
          sheetAllowedDetents: [0.75, 1],
          sheetGrabberVisible: true,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]/rules"
        options={{
          presentation: 'modal',
          sheetAllowedDetents: [0.75, 1],
          sheetGrabberVisible: true,
          headerShown: false,
        }}
      />
    </Stack>
  );
}
