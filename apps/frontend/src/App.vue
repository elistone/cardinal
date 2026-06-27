<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useEnergyStore } from './stores/energy'
import { NowPanel, SensorHealthOverlay } from '@cardinal/ui'
import AppHeader from './components/AppHeader.vue'
import StateNoConfiguration from './components/StateNoConfiguration.vue'
import StateDisconnected from './components/StateDisconnected.vue'

const store = useEnergyStore()
const { snapshot, insight, health, isDisconnected, isConfigured } = storeToRefs(store)

const healthOverlayOpen = ref(false)
</script>

<template>
  <div class="cardinal-app">
    <AppHeader
      :health="health"
      :is-disconnected="isDisconnected"
      @open-health="healthOverlayOpen = true"
    />

    <!-- Not configured: entity mapping is empty -->
    <StateNoConfiguration v-if="isConfigured === false" />

    <!-- Disconnected: connection lost, show stale data dimmed -->
    <StateDisconnected
      v-else-if="isDisconnected"
      :snapshot="snapshot"
      :insight="insight"
    />

    <!-- Live or loading: NowPanel handles null snapshot/insight as loading state -->
    <NowPanel
      v-else
      :snapshot="snapshot"
      :insight="insight"
      :health="health"
    />

    <!-- Sensor health overlay -->
    <SensorHealthOverlay
      v-if="health"
      :health="health"
      :is-open="healthOverlayOpen"
      @close="healthOverlayOpen = false"
    />
  </div>
</template>

<style>
@import './styles/tokens.css';

/*
 * Scope all Cardinal resets to our own element tree.
 * We must not touch html/body — those belong to Home Assistant.
 */
cardinal-panel,
cardinal-panel *,
cardinal-panel *::before,
cardinal-panel *::after {
  box-sizing: border-box;
}

/*
 * Custom elements are display:inline by default.  Make the panel fill
 * whatever height HA's panel container provides — typically the full
 * content area below HA's toolbar.
 */
cardinal-panel {
  display: block;
  height: 100%;
}
</style>

<style scoped>
.cardinal-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  background: var(--color-bg);
  color: var(--color-text-primary);
  font-family: var(--font-family-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
