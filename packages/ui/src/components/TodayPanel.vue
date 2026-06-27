<script setup lang="ts">
import { computed } from 'vue'
import type { DailySummary, DailyFinancials } from '@cardinal/domain'
import TodayCard from './TodayCard.vue'
import FinancialSummary from './FinancialSummary.vue'

interface Props {
  summary: DailySummary | null
  financials: DailyFinancials | null
  isLoading: boolean
}

const props = defineProps<Props>()

// Format today's date as "Monday, 27 June" so the section is temporally anchored.
// The time zone is the local runtime, which is correct for a home dashboard.
const todayLabel = computed(() => {
  const d = props.summary?.date ?? new Date()
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
})
</script>

<template>
  <section class="today-panel" aria-label="Today">
    <header class="today-panel__header">
      <h2 class="today-panel__date">
        {{ isLoading ? 'Today' : todayLabel }}
      </h2>
    </header>

    <div class="today-panel__grid">
      <TodayCard
        label="Solar generated"
        :value-kwh="isLoading ? null : summary?.solar.generatedKwh ?? null"
        :is-loading="isLoading"
      />
      <TodayCard
        label="Home consumed"
        :value-kwh="isLoading ? null : summary?.home.consumedKwh ?? null"
        :is-loading="isLoading"
      />
      <TodayCard
        label="Grid imported"
        :value-kwh="isLoading ? null : summary?.grid.importedKwh ?? null"
        :is-loading="isLoading"
      />
      <TodayCard
        label="Grid exported"
        :value-kwh="isLoading ? null : summary?.grid.exportedKwh ?? null"
        :is-loading="isLoading"
      />
    </div>

    <FinancialSummary
      :saved-amount="financials?.savings ?? null"
      :earned-amount="financials?.exportEarnings ?? null"
      :currency="financials?.currency ?? 'GBP'"
      :is-loading="isLoading"
    />
  </section>
</template>

<style scoped>
.today-panel {
  container-type: inline-size;
  padding: var(--space-6);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.today-panel__header {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.today-panel__date {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--color-text-subdued);
}

.today-panel__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

@container (min-width: 600px) {
  .today-panel__grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
