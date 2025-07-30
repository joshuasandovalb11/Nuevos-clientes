import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <>
      {/* Configuración de la barra de estado */}
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#F8FAFC" 
        translucent={false}
      />
      
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#1F2937',
          headerTitleStyle: styles.headerTitle,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: '📍 Registro de Ubicación',
            headerTitleAlign: 'center',
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
          }} 
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
});