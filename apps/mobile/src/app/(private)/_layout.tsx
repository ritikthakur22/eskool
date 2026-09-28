// add a middleware type only allow the user who are authenticated

//import { useAuth } from "@/auth/AuthContext";
// import StudentTabBar from "@/components/navigation/StudentTabBar";
// import { usePushNotifications } from "@/hooks/usePushNotifications";
// import { Redirect, router, Tabs } from "expo-router";
// import { ActivityIndicator, Text, View } from "react-native";

// export default function StudentLayout() {
//   const { isAuthenticated, isLoading, user } = useAuth();

//   const token = usePushNotifications(isAuthenticated);

//   const profileIncomplete =
//     !!user && (!user.grade || !user.mobile || !user.username);

//   if (isLoading) {
//     return (
//       <View className="flex-1 items-center justify-center bg-white">
//         <ActivityIndicator size="large" color="#0076d1" />
//         <Text className="mt-3 text-base font-medium text-slate-700">
//           Loading…
//         </Text>
//       </View>
//     );
//   }

//   if (!isAuthenticated) {
//     return <Redirect href="/(public)" />;
//   }

//   return (
//     <Tabs
//       tabBar={(props) => <StudentTabBar {...props} />}
//       // backBehavior="history"
//       backBehavior="initialRoute"
//       initialRouteName="dashboard"
//       screenListeners={({ route }) => ({
//         tabPress: (e) => {
//           if (profileIncomplete && route.name !== "profile") {
//             e.preventDefault();
//             router.push("/profile");
//           }
//         },
//       })}
//       screenOptions={{
//         headerShown: false,
//       }}
//     >
//       <Tabs.Screen name="dashboard" />
//       <Tabs.Screen name="live-classes" />
//       <Tabs.Screen name="recorded-classes" />
//       <Tabs.Screen name="test" />
//       <Tabs.Screen name="community" />
//       <Tabs.Screen name="profile" options={{ tabBarButton: () => null }} />
//       <Tabs.Screen name="test-result" options={{ tabBarButton: () => null }} />
//       <Tabs.Screen
//         name="test-attempt/[testId]"
//         options={{ tabBarButton: () => null }}
//       />
//       <Tabs.Screen
//         name="community-profile/[userId]"
//         options={{ tabBarButton: () => null }}
//       />
//       <Tabs.Screen
//         name="payment/[slug]"
//         options={{ tabBarButton: () => null }}
//       />
//     </Tabs>
//   );
// }


// this is how i was checking the authenticated user and then only allowing that user to access the rotues inside this (private) route.
// else send the user to login screen.