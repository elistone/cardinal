<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEnergyStore } from './stores/energy'
import { NowPanel, TodayPanel, SensorHealthOverlay, DiagnosticsPanel } from '@cardinal/ui'
import AppHeader from './components/AppHeader.vue'
import StateNoConfiguration from './components/StateNoConfiguration.vue'
import StateDisconnected from './components/StateDisconnected.vue'

const store = useEnergyStore()
const { snapshot, insight, health, isDisconnected, isConfigured, isLoading, dailySummary, dailyFinancials } = storeToRefs(store)

const lastUpdated = computed(() => snapshot.value?.timestamp ?? null)

const healthOverlayOpen = ref(false)
const showDiagnostics = ref(false)
</script>

<template>
  <div class="cardinal-app">
    <AppHeader
      :health="health"
      :is-disconnected="isDisconnected"
      :show-diagnostics="showDiagnostics"
      :last-updated="lastUpdated"
      @open-health="healthOverlayOpen = true"
      @toggle-diagnostics="showDiagnostics = !showDiagnostics"
    />

    <!-- Not configured: entity mapping is empty -->
    <StateNoConfiguration v-if="isConfigured === false" />

    <!-- Disconnected: connection lost, show stale data dimmed -->
    <StateDisconnected
      v-else-if="isDisconnected"
      :snapshot="snapshot"
      :insight="insight"
    />

    <!--
      Live or loading: NowPanel + TodayPanel inside a single scroll container.
      NowPanel handles null snapshot/insight as its own loading state.
      TodayPanel handles null summary as its own loading state.
      Both sections always render so the scroll position is stable.
    -->
    <div v-else class="cardinal-content">
      <NowPanel
        :snapshot="snapshot"
        :insight="insight"
        :health="health"
      />
      <TodayPanel
        :summary="dailySummary"
        :financials="dailyFinancials"
        :is-loading="isLoading"
      />
    </div>

    <!-- Developer diagnostics (hidden by default, toggled via ⚙ in header) -->
    <DiagnosticsPanel
      v-if="showDiagnostics"
      :snapshot="snapshot"
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
  /*
   * Named container so @container cardinal-app queries below respond to
   * the panel's own width, not the viewport.  The HA sidebar reduces panel
   * width significantly, so viewport-relative breakpoints trigger too early.
   */
  container-type: inline-size;
  container-name: cardinal-app;
}

/*
 * Single scroll root for narrow layouts (mobile, tablet, narrow panel).
 * NowPanel and TodayPanel stack vertically; this container scrolls them.
 */
.cardinal-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  /* iOS safe-area inset: space for home indicator at the bottom of the screen */
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/*
 * Wide layout: NOW and TODAY side-by-side so both are visible without scrolling.
 *
 * At ≥900px panel width the content becomes a 2-column grid.  Each column
 * scrolls independently, so neither section is ever hidden behind the fold.
 * The TODAY column uses border-left instead of its own border-top (which is
 * designed for the vertical-stacking mobile layout).
 *
 * 900px was chosen so the breakpoint triggers when the panel is comfortably
 * wide enough for two columns — typically a 1280px+ monitor with the HA
 * sidebar visible.  On tablets and narrow panels the layout stays vertical.
 */
@container cardinal-app (min-width: 900px) {
  .cardinal-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    overflow: hidden;
    padding-bottom: 0;
  }

  .cardinal-content :deep(.now-panel),
  .cardinal-content :deep(.today-panel) {
    overflow-y: auto;
    height: 100%;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  /* Replace horizontal divider with vertical one for the side-by-side layout */
  .cardinal-content :deep(.today-panel) {
    border-top: none;
    border-left: 1px solid var(--color-border);
  }
}
</style>
