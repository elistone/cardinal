<script setup lang="ts">
import { InsightBlock, EnergyFlowDiagram, MetricCard } from '@cardinal/ui'
</script>

<template>
  <main class="state-loading" aria-busy="true" aria-label="Loading energy data">
    <section class="now-section">
      <h2 class="section-label">NOW</h2>

      <InsightBlock
        title=""
        description=""
        sentiment="neutral"
        confidence="high"
        :is-loading="true"
      />

      <div class="now-content">
        <EnergyFlowDiagram :snapshot="null" :is-loading="true" />

        <div class="now-metrics">
          <MetricCard label="" :value="0" unit="W" concept="solar" :is-loading="true" />
          <MetricCard label="" :value="0" unit="W" concept="battery" :is-loading="true" />
          <MetricCard label="" :value="0" unit="W" concept="grid" :is-loading="true" />
          <MetricCard label="" :value="0" unit="W" concept="home" :is-loading="true" />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.state-loading {
  flex: 1;
  overflow-y: auto;
}

.now-section {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.section-label {
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-subdued);
}

.now-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.now-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

@media (min-width: 1024px) {
  .now-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
    gap: var(--space-6);
  }

  .now-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
